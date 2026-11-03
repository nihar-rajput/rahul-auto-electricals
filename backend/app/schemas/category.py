from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class ProductCategoryBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    slug: Optional[str] = None
    parent_id: Optional[str] = None
    description: Optional[str] = None


class ProductCategoryCreate(ProductCategoryBase):
    pass


class ProductCategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    slug: Optional[str] = None
    parent_id: Optional[str] = None
    description: Optional[str] = None


class ProductCategoryResponse(ProductCategoryBase):
    id: str
    slug: str
    created_at: datetime

    class Config:
        from_attributes = True

