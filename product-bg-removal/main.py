from fastapi import FastAPI, UploadFile, File, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from rembg import remove, new_session
from PIL import Image
import io
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Product Background Removal API")

# Initialize rembg session globally using 'u2net' which is high quality but slightly slower
logger.info("Initializing rembg session with u2net model...")
session = new_session("u2net")
logger.info("Session initialized.")

# Allow all origins for the mobile and web app to interact with the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "ok", "service": "background-removal"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "model": "u2net", "port": 8000}


@app.post("/remove-background")
async def remove_background(
    file: UploadFile = File(...),
    max_size: int = 1200,
    quality: int = 80
):
    """
    Receives an image file, removes the background, applies a pure white background,
    and returns a JPEG image.
    """
    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File provided is not an image")
        
    try:
        logger.info(f"Processing image: {file.filename}")
        
        # Read uploaded file
        image_bytes = await file.read()
        
        # Open source image
        input_image = Image.open(io.BytesIO(image_bytes))
        
        # Ensure image is in RGB or RGBA mode
        if input_image.mode not in ("RGB", "RGBA"):
            input_image = input_image.convert("RGBA")
            
        logger.info("Executing rembg.remove with u2net session and alpha matting...")
        # Remove background - returns an RGBA image where background is transparent
        # Alpha matting greatly improves edges and fine details like hair or fuzzy clothing boundaries
        output = remove(
            input_image, 
            session=session,
            alpha_matting=True,
            alpha_matting_foreground_threshold=240,
            alpha_matting_background_threshold=10,
            alpha_matting_erode_size=10
        )
        logger.info("Background removed successfully")
        
        # Create a pure white background the same size as the output image
        white_bg = Image.new("RGB", output.size, (255, 255, 255))
        
        # If output has an alpha channel (mask), paste it onto the white background honoring the mask
        if len(output.split()) == 4:
            # Use the alpha channel as mask for pasting
            white_bg.paste(output, mask=output.split()[3])
        else:
            # Fallback if no alpha channel
            white_bg.paste(output)
            
        logger.info("White background applied")
        
        # Prepare for compression and response
        # Using specified max width/height
        size = (max_size, max_size)
        white_bg.thumbnail(size, Image.Resampling.LANCZOS)
        
        buffer = io.BytesIO()
        # Save as JPEG with specified quality
        white_bg.save(buffer, format="JPEG", quality=quality, optimize=True)
        buffer.seek(0)
        
        logger.info(f"Image processed successfully. Final size: {white_bg.size}")
        
        return StreamingResponse(
            buffer, 
            media_type="image/jpeg",
            headers={
                "Content-Disposition": f"attachment; filename=processed_{file.filename.split('.')[0]}.jpg"
            }
        )
        
    except Exception as e:
        logger.error(f"Error processing image: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to process image: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
