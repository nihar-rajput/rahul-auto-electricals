from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class VehicleBase(BaseModel):
    manufacturer: str = Field(..., min_length=2, max_length=100)
    model: str = Field(..., min_length=1, max_length=100)
    year: Optional[int] = None
    fuel_type: Optional[str] = None


class VehicleCreate(VehicleBase):
    pass


class VehicleUpdate(BaseModel):
    manufacturer: Optional[str] = Field(None, min_length=2, max_length=100)
    model: Optional[str] = Field(None, min_length=1, max_length=100)
    year: Optional[int] = None
    fuel_type: Optional[str] = None


class VehicleResponse(VehicleBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True

