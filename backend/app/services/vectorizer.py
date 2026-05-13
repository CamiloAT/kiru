"""
vectorizer.py — Convierte imágenes de glifos (bitmap) a contornos vectoriales.

Usa OpenCV para encontrar contornos y los convierte en paths SVG
compatibles con fontTools, sin depender de Potrace externo.
"""

import cv2
import numpy as np
from typing import List, Tuple, Dict


def bitmap_to_contours(glyph_img: np.ndarray) -> List[List[Tuple[int, int]]]:
    """
    Convierte una imagen binaria de un glifo en una lista de contornos (polígonos).
    Cada contorno es una lista de puntos (x, y).
    """
    # Asegurar que sea binaria
    if len(glyph_img.shape) > 2:
        glyph_img = cv2.cvtColor(glyph_img, cv2.COLOR_BGR2GRAY)

    _, thresh = cv2.threshold(glyph_img, 127, 255, cv2.THRESH_BINARY)

    # Suavizar un poco para reducir el efecto "serrucho"
    thresh = cv2.GaussianBlur(thresh, (3, 3), 0)
    _, thresh = cv2.threshold(thresh, 127, 255, cv2.THRESH_BINARY)

    contours, hierarchy = cv2.findContours(
        thresh, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_TC89_L1
    )

    result = []
    if hierarchy is None:
        return result

    for i, cnt in enumerate(contours):
        # Simplificar el contorno para reducir puntos
        epsilon = 0.8  # Tolerancia de simplificación
        approx = cv2.approxPolyDP(cnt, epsilon, True)

        points = [(int(p[0][0]), int(p[0][1])) for p in approx]
        if len(points) >= 3:
            result.append(points)

    return result


def smooth_contour(points: List[Tuple[int, int]], smoothing: float = 2.0) -> List[Tuple[float, float]]:
    """
    Suaviza un contorno usando aproximación de curvas.
    """
    if len(points) < 4:
        return [(float(x), float(y)) for x, y in points]

    pts = np.array(points, dtype=np.float32)

    # Aplicar suavizado con filtro de media móvil
    kernel_size = max(3, int(smoothing) * 2 + 1)
    if kernel_size % 2 == 0:
        kernel_size += 1

    x_smooth = cv2.GaussianBlur(pts[:, 0].reshape(-1, 1), (kernel_size, 1), smoothing).flatten()
    y_smooth = cv2.GaussianBlur(pts[:, 1].reshape(-1, 1), (kernel_size, 1), smoothing).flatten()

    return [(float(x), float(y)) for x, y in zip(x_smooth, y_smooth)]


def contours_to_glyph_data(
    contours: List[List[Tuple[int, int]]],
    canvas_size: int = 256,
    em_size: int = 1000,
    baseline_ratio: float = 0.8,
    smooth: bool = True,
    is_descender: bool = False
) -> Dict:
    """
    Convierte contornos de píxeles a coordenadas de fuente (unidades EM).

    En una fuente, el sistema de coordenadas es:
    - X va de izquierda a derecha
    - Y va de abajo a arriba (invertido respecto a imagen)
    - El baseline está en Y=0
    - Las letras suben hasta ascender (~800 en 1000 EM)
    - Las letras bajan hasta descender (~-200 en 1000 EM)
    """
    scale = em_size / canvas_size
    baseline_y = int(canvas_size * baseline_ratio)

    # Shift descenders down by 15% of the cell height
    y_shift = int(canvas_size * 0.15) if is_descender else 0

    converted_contours = []
    for contour in contours:
        if smooth:
            contour = smooth_contour(contour)

        font_points = []
        for px, py in contour:
            py += y_shift
            # Escalar a unidades EM e invertir Y
            fx = px * scale
            fy = (baseline_y - py) * scale  # Invertir Y y ajustar baseline
            font_points.append((round(fx, 1), round(fy, 1)))

        if len(font_points) >= 3:
            converted_contours.append(font_points)

    # Calcular el ancho del glifo (advance width)
    all_x = [p[0] for contour in converted_contours for p in contour]
    if all_x:
        advance_width = int(max(all_x) + 50 * scale)
    else:
        advance_width = int(em_size * 0.5)

    return {
        "contours": converted_contours,
        "advance_width": min(advance_width, em_size),
    }


def vectorize_glyphs(
    glyphs: Dict[str, np.ndarray],
    smooth: bool = True
) -> Dict[str, Dict]:
    """
    Pipeline completo: recibe dict de {char: imagen} y retorna {char: glyph_data}.
    """
    vectorized = {}
    descenders = {'g', 'j', 'p', 'q', 'y'}

    for char, glyph_img in glyphs.items():
        contours = bitmap_to_contours(glyph_img)
        is_descender = char in descenders
        glyph_data = contours_to_glyph_data(contours, smooth=smooth, is_descender=is_descender)
        vectorized[char] = glyph_data

    return vectorized
