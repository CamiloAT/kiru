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
import cv2
import base64

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
