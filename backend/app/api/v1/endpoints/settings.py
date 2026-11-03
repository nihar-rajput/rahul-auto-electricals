from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.settings import WebsiteSettingsPublicResponse
from app.services.settings_service import get_or_create_settings

router = APIRouter()


@router.get("/settings/public", response_model=WebsiteSettingsPublicResponse)
def get_public_settings(db: Session = Depends(get_db)):
    """Retrieve public business contact information, address, and opening hours."""
    settings = get_or_create_settings(db)
    return WebsiteSettingsPublicResponse.model_validate(settings)

