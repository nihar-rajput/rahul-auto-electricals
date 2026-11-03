from sqlalchemy.orm import Session
from app.models.website_settings import WebsiteSettings
from app.schemas.settings import WebsiteSettingsUpdate


def get_or_create_settings(db: Session) -> WebsiteSettings:
    """Fetch global website settings or create defaults if not present."""
    settings = db.query(WebsiteSettings).filter(WebsiteSettings.id == "default_settings").first()
    if not settings:
        settings = WebsiteSettings(id="default_settings")
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


def update_settings(db: Session, update_data: WebsiteSettingsUpdate) -> WebsiteSettings:
    """Update global business and inventory settings."""
    settings = get_or_create_settings(db)
    
    update_dict = update_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        if value is not None:
            setattr(settings, key, value)
            
    db.commit()
    db.refresh(settings)
    return settings

