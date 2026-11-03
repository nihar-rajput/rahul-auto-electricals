from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class WebsiteSettingsPublicResponse(BaseModel):
    business_name: str
    business_phone: str
    whatsapp_number: str
    business_address: str
    opening_hours: str
    maps_url: str
    default_language: str

    class Config:
        from_attributes = True


class WebsiteSettingsAdminResponse(BaseModel):
    id: str
    business_name: str
    business_phone: str
    whatsapp_number: str
    business_address: str
    opening_hours: str
    maps_url: str
    default_stock_visibility_mode: str
    default_low_stock_threshold: int
    default_language: str
    updated_at: datetime

    class Config:
        from_attributes = True


class WebsiteSettingsUpdate(BaseModel):
    business_name: Optional[str] = Field(None, min_length=2, max_length=200)
    business_phone: Optional[str] = Field(None, min_length=5, max_length=50)
    whatsapp_number: Optional[str] = Field(None, min_length=5, max_length=50)
    business_address: Optional[str] = Field(None, min_length=5, max_length=500)
    opening_hours: Optional[str] = Field(None, min_length=3, max_length=255)
    maps_url: Optional[str] = Field(None, min_length=5, max_length=1000)
    default_stock_visibility_mode: Optional[str] = Field(None, pattern="^(EXACT_QUANTITY|SIMPLE_STATUS|STOCK_LEVEL)$")
    default_low_stock_threshold: Optional[int] = Field(None, ge=0)
    default_language: Optional[str] = Field(None, pattern="^(en|hi)$")

