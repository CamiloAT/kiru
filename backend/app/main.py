"""
main.py — API principal de Kiru.

Endpoints:
- POST /api/generate  → Recibe imagen, procesa y devuelve fuente TTF
- GET  /api/health    → Health check
"""

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
import traceback

from app.services.segmentation import segment_template
from app.services.vectorizer import vectorize_glyphs
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


@app.get("/api/health")
async def health_check():
    """Verifica que la API está corriendo."""
    return {"status": "ok", "message": "Kiru API is running 🖋️"}


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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
