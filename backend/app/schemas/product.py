from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, Field
from app.schemas.brand import BrandResponse
from app.schemas.category import ProductCategoryResponse
from app.schemas.vehicle import VehicleResponse


class ProductImageCreate(BaseModel):
    image_url: str
    is_primary: bool = False
    display_order: int = 0


class ProductImageResponse(BaseModel):
    id: str
    image_url: str
    is_primary: bool
    display_order: int

    class Config:
        from_attributes = True


class ProductVehicleCompatibilityCreate(BaseModel):
    vehicle_id: str
    compatible_from_year: Optional[int] = None
    compatible_to_year: Optional[int] = None
    notes: Optional[str] = None


class ProductVehicleCompatibilityResponse(BaseModel):
    id: str
    vehicle_id: str
    compatible_from_year: Optional[int] = None
    compatible_to_year: Optional[int] = None
    notes: Optional[str] = None
    vehicle: Optional[VehicleResponse] = None

    class Config:
        from_attributes = True


class ProductBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    brand_id: str
    category_id: str
    model: str = Field(..., min_length=1, max_length=100)
    part_number: Optional[str] = None
    battery_type: str = Field(..., pattern="^(Car|Bike|Truck|Inverter|Commercial|Other)$")
    description: Optional[str] = None
    price: Decimal = Field(..., ge=0)
    quantity: int = Field(default=0, ge=0)
    voltage: Optional[str] = None
    ah_capacity: Optional[str] = None
    warranty_duration: Optional[str] = None
    guarantee_details: Optional[str] = None
    low_stock_threshold: int = Field(default=5, ge=0)
    stock_visibility_mode: Optional[str] = Field(None, pattern="^(EXACT_QUANTITY|SIMPLE_STATUS|STOCK_LEVEL)$")
    is_published: bool = True


class ProductCreate(ProductBase):
    slug: Optional[str] = None
    images: Optional[List[ProductImageCreate]] = None
    compatibilities: Optional[List[ProductVehicleCompatibilityCreate]] = None


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=200)
    slug: Optional[str] = None
    brand_id: Optional[str] = None
    category_id: Optional[str] = None
    model: Optional[str] = Field(None, min_length=1, max_length=100)
    part_number: Optional[str] = None
    battery_type: Optional[str] = Field(None, pattern="^(Car|Bike|Truck|Inverter|Commercial|Other)$")
    description: Optional[str] = None
    price: Optional[Decimal] = Field(None, ge=0)
    quantity: Optional[int] = Field(None, ge=0)
    voltage: Optional[str] = None
    ah_capacity: Optional[str] = None
    warranty_duration: Optional[str] = None
    guarantee_details: Optional[str] = None
    low_stock_threshold: Optional[int] = Field(None, ge=0)
    stock_visibility_mode: Optional[str] = Field(None, pattern="^(EXACT_QUANTITY|SIMPLE_STATUS|STOCK_LEVEL)$")
    is_published: Optional[bool] = None
    images: Optional[List[ProductImageCreate]] = None
    compatibilities: Optional[List[ProductVehicleCompatibilityCreate]] = None


# Admin view returns exact inventory, thresholds, and all relational data
class ProductAdminResponse(BaseModel):
    id: str
    name: str
    slug: str
    brand_id: str
    brand: Optional[BrandResponse] = None
    category_id: str
    category: Optional[ProductCategoryResponse] = None
    model: str
    part_number: Optional[str] = None
    battery_type: str
    description: Optional[str] = None
    price: Decimal
    quantity: int
    voltage: Optional[str] = None
    ah_capacity: Optional[str] = None
    warranty_duration: Optional[str] = None
    guarantee_details: Optional[str] = None
    low_stock_threshold: int
    stock_visibility_mode: Optional[str] = None
    is_published: bool
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None
    images: List[ProductImageResponse] = []
    compatibilities: List[ProductVehicleCompatibilityResponse] = []

    class Config:
        from_attributes = True


# Public view strictly masks raw internal numbers unless configured visibility allows it
class ProductPublicResponse(BaseModel):
    id: str
    name: str
    slug: str
    brand: Optional[BrandResponse] = None
    category: Optional[ProductCategoryResponse] = None
    model: str
    part_number: Optional[str] = None
    battery_type: str
    description: Optional[str] = None
    price: Decimal
    voltage: Optional[str] = None
    ah_capacity: Optional[str] = None
    warranty_duration: Optional[str] = None
    guarantee_details: Optional[str] = None
    is_in_stock: bool
    stock_status_text: str
    display_quantity: Optional[int] = None
    images: List[ProductImageResponse] = []
    compatibilities: List[ProductVehicleCompatibilityResponse] = []

    class Config:
        from_attributes = True

