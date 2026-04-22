from fastapi import APIRouter, UploadFile, File, HTTPException
import shutil
import os
import uuid

router = APIRouter(
    prefix="/uploads",
    tags=["uploads"]
)

UPLOAD_DIR = "uploads"

# Ensure the upload directory exists
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("")
async def upload_file(file: UploadFile = File(...)):
    if not file:
        raise HTTPException(status_code=400, detail="No file sent format")

    try:
        # Generate a unique filename to prevent overwrites
        file_extension = file.filename.split(".")[-1]
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # In a real setup, we might return the full URL.
        # Since we are using static files, we just return the relative path from the static mount.
        return {"file_url": f"/static/{unique_filename}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
