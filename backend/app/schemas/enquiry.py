from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class CustomerEnquiryCreate(BaseModel):
    customer_name: str = Field(..., min_length=2, max_length=150)
    phone: str = Field(..., min_length=7, max_length=50)
    vehicle_brand: Optional[str] = None
    vehicle_model: Optional[str] = None
    vehicle_year: Optional[str] = None
    battery_type: Optional[str] = None
    preferred_brand: Optional[str] = None
    message: Optional[str] = None


class CustomerEnquiryUpdate(BaseModel):
    status: Optional[str] = Field(None, pattern="^(NEW|CONTACTED|COMPLETED|CANCELLED)$")
    admin_notes: Optional[str] = None


class CustomerEnquiryResponse(BaseModel):
    id: str
    customer_name: str
    phone: str
    vehicle_brand: Optional[str] = None
    vehicle_model: Optional[str] = None
    vehicle_year: Optional[str] = None
    battery_type: Optional[str] = None
    preferred_brand: Optional[str] = None
    message: Optional[str] = None
    status: str
    admin_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

