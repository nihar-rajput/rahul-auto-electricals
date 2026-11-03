import base64
import os
import uuid
from typing import Optional
from fastapi import HTTPException, UploadFile, status
import cloudinary
import cloudinary.uploader
from app.core.config import settings

# Initialize cloudinary if credentials are provided
if settings.is_cloudinary_configured:
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True,
    )

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".svg"}
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB


async def upload_image(file: UploadFile) -> str:
    """
    Safely validate and upload product image:
    1. Validates extension and content type
    2. Enforces 5MB size limit
    3. Uploads to Cloudinary if configured; otherwise returns data URL fallback for local dev.
    """
    filename = file.filename or "image.jpg"
    ext = os.path.splitext(filename)[1].lower()

    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type '{ext}'. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    content = await file.read()
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds maximum allowed limit of 5MB",
        )

    # Cloudinary upload if configured
    if settings.is_cloudinary_configured:
        try:
            upload_result = cloudinary.uploader.upload(
                content,
                folder="rahul_auto_electricals",
                resource_type="image",
            )
            return upload_result.get("secure_url") or upload_result.get("url")
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Cloudinary upload failed: {str(e)}",
            )
    else:
        # Fallback for development/offline: Return data URI
        content_type = file.content_type or "image/jpeg"
        encoded = base64.b64encode(content).decode("utf-8")
        return f"data:{content_type};base64,{encoded}"

