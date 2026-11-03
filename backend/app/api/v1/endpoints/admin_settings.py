from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.permissions import require_super_admin
from app.models.admin_user import AdminUser
from app.schemas.settings import (
    WebsiteSettingsAdminResponse,
    WebsiteSettingsUpdate,
)
from app.services.settings_service import (
    get_or_create_settings,
    update_settings,
)

router = APIRouter()


@router.get("/settings", response_model=WebsiteSettingsAdminResponse)
def get_admin_settings(
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(require_super_admin),
):
    """Retrieve all website, contact, and inventory visibility configuration."""
    settings = get_or_create_settings(db)
    return WebsiteSettingsAdminResponse.model_validate(settings)


@router.put("/settings", response_model=WebsiteSettingsAdminResponse)
def modify_admin_settings(
    settings_in: WebsiteSettingsUpdate,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(require_super_admin),
):
    """Update website, contact, and inventory visibility configuration."""
    settings = update_settings(db, settings_in)
    return WebsiteSettingsAdminResponse.model_validate(settings)

