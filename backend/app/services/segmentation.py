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

    # Detectar líneas horizontales y verticales
    horizontal_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (w // (expected_cols + 2), 1))
    vertical_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, h // (expected_rows + 2)))

    horizontal_lines = cv2.morphologyEx(binary, cv2.MORPH_OPEN, horizontal_kernel, iterations=2)
    vertical_lines = cv2.morphologyEx(binary, cv2.MORPH_OPEN, vertical_kernel, iterations=2)

    # Combinar líneas para obtener la cuadrícula
    grid = cv2.add(horizontal_lines, vertical_lines)

    # Encontrar contornos de las celdas
    contours, _ = cv2.findContours(grid, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)

    # Filtrar contornos que sean celdas razonables
    min_cell_w = w // (expected_cols * 3)
    max_cell_w = w // max(expected_cols // 2, 1)
    min_cell_h = h // (expected_rows * 3)
    max_cell_h = h // max(expected_rows // 2, 1)

    cells = []
    for cnt in contours:
        x, y, cw, ch = cv2.boundingRect(cnt)
        if min_cell_w < cw < max_cell_w and min_cell_h < ch < max_cell_h:
            cells.append((x, y, cw, ch))

    # Ordenar: primero por Y (filas), luego por X (columnas)
    cells.sort(key=lambda c: (c[1] // (h // (expected_rows + 1)), c[0]))

    return cells


def extract_glyph_from_cell(binary: np.ndarray, cell: Tuple[int, int, int, int], padding: int = 8) -> np.ndarray:
    """
    Extrae el contenido de una celda, recortando el espacio vacío alrededor del carácter.
    Retorna una imagen cuadrada del glifo normalizada.
    """
    x, y, w, h = cell
    # Recortar la celda con un pequeño margen interior para evitar los bordes de la cuadrícula
    margin = max(w, h) // 10
    cell_img = binary[y + margin:y + h - margin, x + margin:x + w - margin]

    if cell_img.size == 0:
        return np.zeros((256, 256), dtype=np.uint8)

    # Encontrar el bounding box del contenido real (la tinta)
    coords = cv2.findNonZero(cell_img)
    if coords is None:
        return np.zeros((256, 256), dtype=np.uint8)

    bx, by, bw, bh = cv2.boundingRect(coords)
    glyph = cell_img[by:by + bh, bx:bx + bw]

    # Normalizar a un tamaño cuadrado estándar (256x256) con padding
    target_size = 256 - 2 * padding
    if bw > bh:
        scale = target_size / bw
    else:
        scale = target_size / bh

    new_w = int(bw * scale)
    new_h = int(bh * scale)
    glyph_resized = cv2.resize(glyph, (new_w, new_h), interpolation=cv2.INTER_AREA)

    # Centrar en canvas cuadrado
    canvas = np.zeros((256, 256), dtype=np.uint8)
    ox = (256 - new_w) // 2
    oy = (256 - new_h) // 2
    canvas[oy:oy + new_h, ox:ox + new_w] = glyph_resized

    return canvas


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
