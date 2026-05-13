"""
font_builder.py — Ensambla los glifos vectorizados en un archivo de fuente TTF.

Usa fontTools para crear un archivo TrueType desde cero con los contornos
extraídos de la escritura del usuario.
"""

from fontTools.fontBuilder import FontBuilder
from fontTools.ttLib import TTFont
from fontTools.pens.ttGlyphPen import TTGlyphPen
from typing import Dict
import io


# Mapeo de caracteres a nombres de glifos estándar
CHAR_TO_GLYPH_NAME = {
    'A': 'A', 'B': 'B', 'C': 'C', 'D': 'D', 'E': 'E', 'F': 'F',
    'G': 'G', 'H': 'H', 'I': 'I', 'J': 'J', 'K': 'K', 'L': 'L',
    'M': 'M', 'N': 'N', 'Ñ': 'Ntilde', 'O': 'O', 'P': 'P', 'Q': 'Q',
    'R': 'R', 'S': 'S', 'T': 'T', 'U': 'U', 'V': 'V', 'W': 'W',
    'X': 'X', 'Y': 'Y', 'Z': 'Z',
    'a': 'a', 'b': 'b', 'c': 'c', 'd': 'd', 'e': 'e', 'f': 'f',
    'g': 'g', 'h': 'h', 'i': 'i', 'j': 'j', 'k': 'k', 'l': 'l',
    'm': 'm', 'n': 'n', 'ñ': 'ntilde', 'o': 'o', 'p': 'p', 'q': 'q',
    'r': 'r', 's': 's', 't': 't', 'u': 'u', 'v': 'v', 'w': 'w',
    'x': 'x', 'y': 'y', 'z': 'z',
    '0': 'zero', '1': 'one', '2': 'two', '3': 'three', '4': 'four',
    '5': 'five', '6': 'six', '7': 'seven', '8': 'eight', '9': 'nine',
    '.': 'period', ',': 'comma', ';': 'semicolon', ':': 'colon',
    '!': 'exclam', '¡': 'exclamdown', '?': 'question', '¿': 'questiondown',
    "'": 'quotesingle', '"': 'quotedbl',
    '(': 'parenleft', ')': 'parenright', '-': 'hyphen',
    'á': 'aacute', 'é': 'eacute', 'í': 'iacute', 'ó': 'oacute',
    'ú': 'uacute', 'ü': 'udieresis',
}


def build_font(
    vectorized_glyphs: Dict[str, Dict],
    font_name: str = "MiLetra",
    family_name: str = "Mi Letra",
) -> bytes:
    """
    Construye un archivo TTF a partir de glifos vectorizados.

    Args:
        vectorized_glyphs: Dict con {char: {contours: [...], advance_width: int}}
        font_name: Nombre PostScript de la fuente
        family_name: Nombre de la familia tipográfica

    Returns:
        bytes del archivo TTF generado
    """
    em_size = 1000
    ascent = 800
    descent = -200

    # Preparar la lista de glifos y el mapeo cmap
    glyph_names = [".notdef", "space"]
    cmap = {0x20: "space"}  # Espacio

    char_to_name = {}
    for char, glyph_data in vectorized_glyphs.items():
        name = CHAR_TO_GLYPH_NAME.get(char, f"uni{ord(char):04X}")
        glyph_names.append(name)
        cmap[ord(char)] = name
        char_to_name[char] = name

    # Crear la fuente con FontBuilder
    fb = FontBuilder(em_size, isTTF=True)
    fb.setupGlyphOrder(glyph_names)
    fb.setupCharacterMap(cmap)

    # Definir los contornos de cada glifo
    # Construir las tablas glyf usando un dict de drawings
    drawings = {}

    # .notdef glyph: un rectángulo simple
    drawings[".notdef"] = {
        "contours": [[(0, 0), (500, 0), (500, 700), (0, 700)]],
        "advance_width": 500
    }

    # space glyph: vacío
    drawings["space"] = {
        "contours": [],
        "advance_width": int(em_size * 0.3)
    }

    # Los glifos del usuario
    for char, glyph_data in vectorized_glyphs.items():
        name = char_to_name[char]
        drawings[name] = glyph_data

    # Dibujar todos los glifos usando TTGlyphPen
    glyphs = {}
    advance_widths = {}

    for glyph_name in glyph_names:
        data = drawings.get(glyph_name, {"contours": [], "advance_width": int(em_size * 0.5)})
        contours = data.get("contours", [])
        adv_w = data.get("advance_width", int(em_size * 0.5))

        advance_widths[glyph_name] = (adv_w, 0)

        pen = TTGlyphPen(None)
        for contour in contours:
            if len(contour) < 3:
                continue
            pen.moveTo(contour[0])
            for point in contour[1:]:
                pen.lineTo(point)
            pen.closePath()
            
        glyphs[glyph_name] = pen.glyph()

    fb.setupGlyf(glyphs)
    fb.setupHorizontalMetrics(advance_widths)

    # Métricas de la fuente
    fb.setupHorizontalHeader(ascent=ascent, descent=descent)
    fb.setupNameTable({
        "familyName": family_name,
        "styleName": "Regular",
    })
    fb.setupOS2(
        sTypoAscender=ascent,
        sTypoDescender=descent,
        sTypoLineGap=0,
        usWinAscent=ascent,
        usWinDescent=abs(descent),
    )
    fb.setupPost()

    # Exportar a bytes
    font = fb.font
    buffer = io.BytesIO()
    font.save(buffer)
    buffer.seek(0)

    return buffer.read()
