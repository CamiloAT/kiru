"""
main.py — API principal de Kiru.

Endpoints:
- POST /api/generate             → Recibe imagen, procesa y devuelve fuente TTF
- POST /api/generate-from-glyphs → Recibe glyphs editados (base64) y devuelve fuente TTF
- POST /api/extract              → Extrae glyphs de la plantilla como base64
- GET  /api/health               → Health check
"""

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
from typing import Dict, Optional
import traceback
import cv2
import numpy as np
import base64
import hashlib
import time

from app.services.segmentation import segment_template
from app.services.vectorizer import vectorize_glyphs, normalize_glyphs
from app.services.font_builder import build_font

app = FastAPI(
    title="Kiru API",
    description="Convierte escritura manual en fuentes tipográficas",
    version="1.0.0",
)

# CORS para desarrollo local
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cache para evitar re-vectorizar en cada cambio de padding
_vectorize_cache: Dict[str, Dict] = {}
_cache_max = 5

@app.get("/api/health")
async def health_check():
    """Verifica que la API está corriendo."""
    return {"status": "ok", "message": "Kiru API is running 🖋️"}


@app.post("/api/extract")
async def extract_glyphs(
    image: UploadFile = File(...),
    template_type: str = Form(default="full"),
):
    """
    Extrae los caracteres de la plantilla y los retorna como imágenes PNG en base64
    para que el frontend pueda editarlos individualmente.
    """
    try:
        contents = await image.read()
        glyphs = segment_template(contents, template_type)
        
        extracted_data = {}
        for char, glyph_img in glyphs.items():
            if glyph_img is not None and glyph_img.size > 0:
                # Convertir binario (fondo negro expansivo, texto blanco 255) 
                # a PNG con fondo transparente y texto negro para el Frontend
                rgba = cv2.cvtColor(glyph_img, cv2.COLOR_GRAY2BGRA)
                rgba[:, :, 3] = glyph_img  # The alpha channel is the binary mask 
                rgba[:, :, 0:3] = 0        # Make the text color black (0,0,0)
                
                success, buffer = cv2.imencode(".png", rgba)
                if success:
                    encoded = base64.b64encode(buffer).decode("utf-8")
                    extracted_data[char] = f"data:image/png;base64,{encoded}"
                    
        return {"status": "success", "glyphs": extracted_data}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error al extraer glifos: {str(e)}")


@app.post("/api/generate")
async def generate_font(
    image: UploadFile = File(...),
    font_name: str = Form(default="MiLetra"),
    template_type: str = Form(default="full"),
    smooth: bool = Form(default=True),
):
    """
    Recibe una imagen de la plantilla escaneada y genera una fuente TTF.

    - **image**: Imagen JPG/PNG de la plantilla llena
    - **font_name**: Nombre para la fuente generada
    - **template_type**: Tipo de plantilla (full, uppercase, lowercase, digits)
    - **smooth**: Aplicar suavizado a los trazos
    """
    # Validar formato
    if image.content_type not in ["image/jpeg", "image/png", "image/webp"]:
        raise HTTPException(
            status_code=400,
            detail="Formato no soportado. Usa JPG, PNG o WebP."
        )

    try:
        # Leer la imagen
        image_bytes = await image.read()

        # 1. Segmentar: detectar y extraer cada carácter
        glyphs = segment_template(image_bytes, template_type=template_type)

        # 2. Vectorizar: convertir bitmaps a contornos vectoriales
        vectorized = vectorize_glyphs(glyphs, smooth=smooth)

        # 2.5. Normalizar: alinear baselines y anchos dinámicos
        vectorized = normalize_glyphs(vectorized)

        # 3. Ensamblar: crear el archivo TTF
        safe_name = "".join(c for c in font_name if c.isalnum() or c in "-_ ")[:30]
        ttf_bytes = build_font(
            vectorized,
            font_name=safe_name.replace(" ", ""),
            family_name=safe_name or "MiLetra",
        )

        # Retornar el archivo TTF
        return Response(
            content=ttf_bytes,
            media_type="font/ttf",
            headers={
                "Content-Disposition": f'attachment; filename="{safe_name or "MiLetra"}.ttf"'
            }
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Error procesando la imagen: {str(e)}"
        )


def decode_base64_glyph(b64_data: str) -> np.ndarray:
    """
    Convierte un base64 RGBA PNG del frontend a un array binario 2D listo para el vectorizer.
    El frontend envía RGBA donde alpha=255 donde hay tinta, 0 donde fondo transparente.
    Retorna: np.ndarray uint8 de shape (256, W) con ink=255, bg=0, borde de 10px.
    """
    raw = base64.b64decode(b64_data.split(",")[1])
    nparr = np.frombuffer(raw, np.uint8)
    rgba = cv2.imdecode(nparr, cv2.IMREAD_UNCHANGED)

    if rgba is None or rgba.size == 0:
        raise ValueError("No se pudo decodificar el glyph")

    # Extraer canal alpha como máscara de tinta
    if len(rgba.shape) == 3 and rgba.shape[2] == 4:
        glyph = rgba[:, :, 3]
    elif len(rgba.shape) == 2:
        glyph = rgba
    else:
        glyph = cv2.cvtColor(rgba, cv2.COLOR_BGR2GRAY)

    # Redimensionar a height=256 manteniendo proporción
    h, w = glyph.shape
    if h == 0 or w == 0:
        raise ValueError("Glyph vacío")
    scale = 256 / h
    target_w = max(1, int(w * scale))
    glyph = cv2.resize(glyph, (target_w, 256), interpolation=cv2.INTER_AREA)

    # Re-umbralizar para asegurar binario tras interpolación
    _, glyph = cv2.threshold(glyph, 127, 255, cv2.THRESH_BINARY)

    # Añadir borde de 10px de cero
    glyph = cv2.copyMakeBorder(glyph, 10, 10, 10, 10, cv2.BORDER_CONSTANT, value=0)

    return glyph


class GenerateFromGlyphsRequest(BaseModel):
    glyphs: Dict[str, str]  # { char: "data:image/png;base64,..." }
    font_name: str = "MiLetra"
    template_type: str = "full"
    smooth: bool = True
    padding_ratio: Optional[float] = None


@app.post("/api/generate-from-glyphs")
async def generate_from_glyphs(request: GenerateFromGlyphsRequest):
    """
    Recibe glyphs editados del frontend (base64 RGBA PNG) y genera una fuente TTF.
    Cachea la vectorización para que cambios de solo padding sean instantáneos.
    """
    try:
        if not request.glyphs:
            raise HTTPException(status_code=400, detail="No se enviaron glyphs")

        # Cache key: hash of all glyph data (use full data to avoid collisions)
        h = hashlib.md5()
        for k, v in sorted(request.glyphs.items()):
            h.update(f"{k}:".encode())
            h.update(v.encode())
        cache_key = h.hexdigest()

        if cache_key in _vectorize_cache:
            vectorized = _vectorize_cache[cache_key]
        else:
            # 1. Decodificar y convertir cada glyph base64 → array binario
            decoded = {}
            for char, b64_data in request.glyphs.items():
                try:
                    decoded[char] = decode_base64_glyph(b64_data)
                except Exception as e:
                    print(f"Advertencia: glyph '{char}' no se pudo decodificar: {e}")
                    continue

            if not decoded:
                raise HTTPException(status_code=400, detail="Ningún glyph pudo ser procesado")

            # 2. Vectorizar
            vectorized = vectorize_glyphs(decoded, smooth=request.smooth)

            # Cache (LRU simple)
            if len(_vectorize_cache) >= _cache_max:
                oldest = next(iter(_vectorize_cache))
                del _vectorize_cache[oldest]
            _vectorize_cache[cache_key] = vectorized

        # 3. Normalizar con padding actual
        final = normalize_glyphs(vectorized, padding_ratio=request.padding_ratio)

        # 4. Ensamblar TTF
        safe_name = "".join(c for c in request.font_name if c.isalnum() or c in "-_ ")[:30]
        ttf_bytes = build_font(
            final,
            font_name=safe_name.replace(" ", ""),
            family_name=safe_name or "MiLetra",
        )

        return Response(
            content=ttf_bytes,
            media_type="font/ttf",
            headers={
                "Content-Disposition": f'attachment; filename="{safe_name or "MiLetra"}.ttf"'
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Error generando fuente: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
