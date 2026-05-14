"""
segmentation.py — Segmentación de caracteres desde la plantilla escaneada.

Usa OpenCV para:
1. Convertir a escala de grises y binarizar.
2. Detectar la cuadrícula de la plantilla.
3. Extraer cada celda con su carácter individual.
"""

import cv2
import numpy as np
from typing import List, Tuple, Dict, Optional

# Orden de caracteres en la plantilla (debe coincidir con template_gen del frontend)
TEMPLATE_CHARS_UPPER = list("ABCDEFGHIJKLMNÑOPQRSTUVWXYZ")
TEMPLATE_CHARS_LOWER = list("abcdefghijklmnñopqrstuvwxyz")
TEMPLATE_CHARS_DIGITS = list("0123456789")
TEMPLATE_CHARS_SYMBOLS = list(".,:;!¡?¿'\"()-áéíóúü")
TEMPLATE_CHARS_EXTENDED_SYMBOLS = list("ÁÉÍÓÚÜáéíóúü.,:;!¡?¿'\"()-=_+*/\\|@#$%&<>[]{}~^`")

ALL_CHARS = TEMPLATE_CHARS_UPPER + TEMPLATE_CHARS_LOWER + TEMPLATE_CHARS_DIGITS + TEMPLATE_CHARS_SYMBOLS
EXTENDED_CHARS = TEMPLATE_CHARS_UPPER + TEMPLATE_CHARS_LOWER + TEMPLATE_CHARS_DIGITS + TEMPLATE_CHARS_EXTENDED_SYMBOLS

def preprocess_image(image_bytes: bytes) -> np.ndarray:
    """Convierte bytes de imagen a una imagen OpenCV preprocesada (binaria)."""
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("No se pudo decodificar la imagen")

    # Añadir un borde blanco extra para evitar que las celdas de las orillas se mezclen con el límite de la imagen
    img = cv2.copyMakeBorder(img, 40, 40, 40, 40, cv2.BORDER_CONSTANT, value=[255, 255, 255])

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    # Threshold adaptativo para manejar iluminación irregular
    binary = cv2.adaptiveThreshold(
        gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY_INV, 31, 15
    )
    return binary


def find_grid_cells(binary: np.ndarray, expected_cols: int, expected_rows: int) -> List[Tuple[int, int, int, int]]:
    """
    Detecta las celdas de la cuadrícula en la imagen binarizada.
    Retorna una lista de (x, y, w, h) ordenadas de izquierda a derecha, arriba a abajo.
    """
    h, w = binary.shape

    # Encontrar contornos directamente sobre la imagen binaria (las cajas son desconectadas)
    contours, _ = cv2.findContours(binary, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)

    # Filtrar contornos que sean celdas cuadradas razonables
    min_cell_size = w // (expected_cols * 3)
    max_cell_size = int((w / expected_cols) * 2.0)

    raw_cells = []
    for cnt in contours:
        x, y, cw, ch = cv2.boundingRect(cnt)
        if min_cell_size < cw < max_cell_size and min_cell_size < ch < max_cell_size:
            aspect = cw / ch
            if 0.5 < aspect < 2.0:
                # Filtrar si está demasiado cerca del borde (ejemplo: menos del 1% del ancho)
                # O simplemente relajar las condiciones de aspecto y tamaño
                raw_cells.append((x, y, cw, ch))
                
    if not raw_cells:
        return []

    # Filtrar basado en la mediana del tamaño para quitar marcas perdidas
    median_w = np.median([c[2] for c in raw_cells])
    median_h = np.median([c[3] for c in raw_cells])
    
    # Tolerancia más alta para la detección (50% en vez de 30%)
    filtered_cells = []
    for x, y, cw, ch in raw_cells:
        if abs(cw - median_w) < median_w * 0.5 and abs(ch - median_h) < median_h * 0.5:
            filtered_cells.append((x, y, cw, ch))

    # Filtrar superposiciones
    cells = []
    for rc in filtered_cells:
        rx, ry, rw, rh = rc
        overlap = False
        for c in cells:
            cx, cy, cw, ch = c
            ix = max(rx, cx)
            iy = max(ry, cy)
            iw = min(rx+rw, cx+cw) - ix
            ih = min(ry+rh, cy+ch) - iy
            if iw > 0 and ih > 0:
                if (iw * ih) > 0.5 * (rw * rh):
                    overlap = True
                    break
        if not overlap:
            cells.append(rc)

    # Ordenar celdas de forma robusta por filas y columnas
    # 1. Ordenar por Y
    cells.sort(key=lambda c: c[1])

    # Asignación de celdas a la cuadrícula usando agrupamiento (clustering) de coordenadas
    final_flat_cells: List[Tuple[int, int, int, int]] = [(0, 0, 0, 0)] * (expected_rows * expected_cols)
    final_flat_cells_assigned = [False] * (expected_rows * expected_cols)
    if cells:
        all_center_x = [c[0] + c[2]/2 for c in cells]
        all_center_y = [c[1] + c[3]/2 for c in cells]
        
        # Agrupar coordenadas en columnas
        sorted_x = sorted(list(set(all_center_x)))
        cols_clusters = []
        for x in sorted_x:
            if not cols_clusters or x - cols_clusters[-1][-1] > w // (expected_cols * 2):
                cols_clusters.append([x])
            else:
                cols_clusters[-1].append(x)
        col_centers = [sum(cluster)/len(cluster) for cluster in cols_clusters]
        
        # Agrupar coordenadas en filas
        sorted_y = sorted(list(set(all_center_y)))
        rows_clusters = []
        for y in sorted_y:
            if not rows_clusters or y - rows_clusters[-1][-1] > h // (expected_rows * 2):
                rows_clusters.append([y])
            else:
                rows_clusters[-1].append(y)
        row_centers = [sum(cluster)/len(cluster) for cluster in rows_clusters]
        
        # Si faltan columnas o filas por detectar (ej. la primera cortada), forzamos una cuadrícula matemática
        if len(col_centers) < expected_cols or len(row_centers) < expected_rows:
            min_cx, max_cx = min(all_center_x), max(all_center_x)
            min_cy, max_cy = min(all_center_y), max(all_center_y)
            # asumiendo que los que vimos son los extremos o cercanos, proyectamos matemáticamente
            grid_w = max_cx - min_cx
            grid_h = max_cy - min_cy
            
            # Recalcular centros con pasos equidistantes usando el tamaño esperado total de la rejilla
            # La distancia entre la celda más a la izquierda detectada y el inicio podría variar,
            # pero asumiremos por simplicidad que si hay menos, es porque se perdieron de los bordes.
            # Por ahora, simplemente rellenamos equitativamente
            cw_step = grid_w / max(1, len(col_centers) - 1) if len(col_centers) > 1 else max_cx
            rh_step = grid_h / max(1, len(row_centers) - 1) if len(row_centers) > 1 else max_cy
            
            # Para evitar que todo quede corrido hacia un lado si el faltante es al frente,
            # vamos a centrar la cuadrícula basándonos en la celda detectada más a la izquierda:
            col_centers = [col_centers[0] + cw_step * (i - 0) for i in range(expected_cols)]
            row_centers = [row_centers[0] + rh_step * (i - 0) for i in range(expected_rows)]
        
        # Garantizar que no tenemos más columnas/filas de las esperadas (cortar exceso de ruido)
        if len(col_centers) > expected_cols:
            col_centers = col_centers[:expected_cols]
        if len(row_centers) > expected_rows:
            row_centers = row_centers[:expected_rows]

        for c in cells:
            cx = c[0] + c[2]/2
            cy = c[1] + c[3]/2
            
            # Encontrar el índice de columna más cercano
            col_idx = min(range(len(col_centers)), key=lambda i: abs(col_centers[i] - cx))
            # Encontrar el índice de fila más cercano
            row_idx = min(range(len(row_centers)), key=lambda i: abs(row_centers[i] - cy))
            
            idx = row_idx * expected_cols + col_idx
            
            if not final_flat_cells_assigned[idx]:
                final_flat_cells[idx] = c
                final_flat_cells_assigned[idx] = True
            else:
                # Fallback de colisión simple
                for offset in range(1, expected_cols):
                    if col_idx + offset < expected_cols and not final_flat_cells_assigned[row_idx * expected_cols + col_idx + offset]:
                        final_flat_cells[row_idx * expected_cols + col_idx + offset] = c
                        final_flat_cells_assigned[row_idx * expected_cols + col_idx + offset] = True
                        break
                    elif col_idx - offset >= 0 and not final_flat_cells_assigned[row_idx * expected_cols + col_idx - offset]:
                        final_flat_cells[row_idx * expected_cols + col_idx - offset] = c
                        final_flat_cells_assigned[row_idx * expected_cols + col_idx - offset] = True
                        break

        # COMPLETAR CELDAS FALTANTES USANDO MATEMÁTICAS
        # Si OpenCV no detectó la caja porque el usuario escribió sobre la línea o se cortó
        for row_idx in range(expected_rows):
            for col_idx in range(expected_cols):
                idx = row_idx * expected_cols + col_idx
                if not final_flat_cells_assigned[idx]:
                    # Sintetizar las coordenadas usando los centros agrupados o calculados
                    if col_idx < len(col_centers) and row_idx < len(row_centers):
                        pred_cx = col_centers[col_idx]
                        pred_cy = row_centers[row_idx]
                        final_flat_cells[idx] = (
                            int(pred_cx - median_w / 2),
                            int(pred_cy - median_h / 2),
                            int(median_w),
                            int(median_h)
                        )

    return final_flat_cells


def extract_glyph_from_cell(binary: np.ndarray, cell: Tuple[int, int, int, int]) -> np.ndarray:
    """
    Extrae el contenido de una celda conservando su altura total pero ajustando el ancho a la tinta.
    Esto permite mantener el "baseline" natural y el ancho proporcional (ej: 'i' vs 'w').
    """
    x, y, w, h = cell
    margin_x = int(w * 0.04)
    margin_y = int(h * 0.04)
    
    # Recortamos los bordes proporcionalmente para evitar ruido de la grilla
    cell_img = binary[y + margin_y:y + h - margin_y, x + margin_x:x + w - margin_x]

    if cell_img.size == 0:
        return np.zeros((256, 20), dtype=np.uint8)

    coords = cv2.findNonZero(cell_img)
    if coords is None:
        return np.zeros((256, 20), dtype=np.uint8)

    bx, by, bw, bh = cv2.boundingRect(coords)

    # Padding horizontal ligero para que la letra no toque exactamente el borde
    h_pad = max(1, w // 20)
    start_x = max(0, bx - h_pad)
    end_x = min(cell_img.shape[1], bx + bw + h_pad)

    # Recortar solo horizontalmente (mantener altura completa de la celda)
    glyph_col = cell_img[:, start_x:end_x]

    if glyph_col.size == 0 or glyph_col.shape[1] == 0:
        return np.zeros((256, 20), dtype=np.uint8)

    # Redimensionar para que la altura sea exactamente 256, ancho proporcional
    target_h = 256
    scale = target_h / glyph_col.shape[0]
    target_w = max(1, int(glyph_col.shape[1] * scale))

    glyph_resized = cv2.resize(glyph_col, (target_w, target_h), interpolation=cv2.INTER_AREA)

    return glyph_resized


def segment_template(image_bytes: bytes, template_type: str = "full") -> Dict[str, np.ndarray]:
    """
    Pipeline completo de segmentación.
    Recibe los bytes de la imagen escaneada y retorna un dict {caracter: imagen_glifo}.
    """
    if template_type == "uppercase":
        chars = TEMPLATE_CHARS_UPPER
        cols, rows = 9, 3
    elif template_type == "lowercase":
        chars = TEMPLATE_CHARS_LOWER
        cols, rows = 9, 3
    elif template_type == "digits":
        chars = TEMPLATE_CHARS_DIGITS
        cols, rows = 5, 2
    elif template_type == "extended":
        chars = EXTENDED_CHARS
        cols, rows = 10, 11
    else:  # full
        chars = ALL_CHARS
        cols, rows = 9, 10

    binary = preprocess_image(image_bytes)
    cells = find_grid_cells(binary, expected_cols=cols, expected_rows=rows)

    glyphs = {}
    for i, char in enumerate(chars):
        if i < len(cells):
            cell = cells[i]
            if cell != (0, 0, 0, 0):
                glyph_img = extract_glyph_from_cell(binary, cell)
            else:
                glyph_img = np.zeros((256, 256), dtype=np.uint8)
        else:
            glyph_img = np.zeros((256, 256), dtype=np.uint8)
        glyphs[char] = glyph_img

    return glyphs
