"""
segmentation.py — Segmentación de caracteres desde la plantilla escaneada.

Usa OpenCV para:
1. Convertir a escala de grises y binarizar.
2. Detectar la cuadrícula de la plantilla.
3. Extraer cada celda con su carácter individual.
"""

import cv2
import numpy as np
from typing import List, Tuple, Dict

# Orden de caracteres en la plantilla (debe coincidir con template_gen del frontend)
TEMPLATE_CHARS_UPPER = list("ABCDEFGHIJKLMNÑOPQRSTUVWXYZ")
TEMPLATE_CHARS_LOWER = list("abcdefghijklmnñopqrstuvwxyz")
TEMPLATE_CHARS_DIGITS = list("0123456789")
TEMPLATE_CHARS_SYMBOLS = list(".,;:!¡?¿'\"()-áéíóúü")

ALL_CHARS = TEMPLATE_CHARS_UPPER + TEMPLATE_CHARS_LOWER + TEMPLATE_CHARS_DIGITS + TEMPLATE_CHARS_SYMBOLS


def preprocess_image(image_bytes: bytes) -> np.ndarray:
    """Convierte bytes de imagen a una imagen OpenCV preprocesada (binaria)."""
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("No se pudo decodificar la imagen")

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
    min_cell_size = w // (expected_cols * 2)
    max_cell_size = int((w / expected_cols) * 1.5)

    raw_cells = []
    for cnt in contours:
        x, y, cw, ch = cv2.boundingRect(cnt)
        if min_cell_size < cw < max_cell_size and min_cell_size < ch < max_cell_size:
            aspect = cw / ch
            if 0.7 < aspect < 1.3:
                raw_cells.append((x, y, cw, ch))

    # Filtrar celdas superpuestas (el borde interno y externo de la misma caja)
    cells = []
    for rc in raw_cells:
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

    rows_list = []
    current_row = []
    
    if cells:
        last_y = cells[0][1]
        # Tolerancia para considerar que una celda está en la misma fila
        row_tolerance = max(10, (h // expected_rows) // 3)

        for c in cells:
            if abs(c[1] - last_y) > row_tolerance:
                # Nueva fila
                current_row.sort(key=lambda x: x[0])
                rows_list.extend(current_row)
                current_row = [c]
                last_y = c[1]
            else:
                current_row.append(c)

        if current_row:
            current_row.sort(key=lambda x: x[0])
            rows_list.extend(current_row)

    return rows_list


def extract_glyph_from_cell(binary: np.ndarray, cell: Tuple[int, int, int, int]) -> np.ndarray:
    """
    Extrae el contenido de una celda conservando su altura total pero ajustando el ancho a la tinta.
    Esto permite mantener el "baseline" natural y el ancho proporcional (ej: 'i' vs 'w').
    """
    x, y, w, h = cell
    margin = 3
    
    # Recortamos ligeramente los bordes para evitar ruido de la grilla (3 píxeles)
    cell_img = binary[y + margin:y + h - margin, x + margin:x + w - margin]

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
    else:  # full
        chars = ALL_CHARS
        cols, rows = 9, 10

    binary = preprocess_image(image_bytes)
    cells = find_grid_cells(binary, expected_cols=cols, expected_rows=rows)

    glyphs = {}
    for i, char in enumerate(chars):
        if i < len(cells):
            glyph_img = extract_glyph_from_cell(binary, cells[i])
        else:
            glyph_img = np.zeros((256, 256), dtype=np.uint8)
        glyphs[char] = glyph_img

    return glyphs
