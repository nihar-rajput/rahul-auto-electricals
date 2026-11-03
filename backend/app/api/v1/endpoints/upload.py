from fastapi import APIRouter, Depends, File, UploadFile
from app.core.permissions import get_current_active_admin
from app.models.admin_user import AdminUser
from app.services.upload_service import upload_image

router = APIRouter()


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    current_admin: AdminUser = Depends(get_current_active_admin),
):
    """Upload product image safely to Cloudinary or secure fallback data URI."""
    image_url = await upload_image(file)
    return {"image_url": image_url}

