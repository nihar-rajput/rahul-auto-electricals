from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class BrandBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    slug: Optional[str] = None
    is_active: bool = True
    logo_url: Optional[str] = None
    description: Optional[str] = None


class BrandCreate(BrandBase):
    pass


class BrandUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    slug: Optional[str] = None
    is_active: Optional[bool] = None
    logo_url: Optional[str] = None
    description: Optional[str] = None


class BrandResponse(BrandBase):
    id: str
    slug: str
    created_at: datetime

    class Config:
        from_attributes = True

