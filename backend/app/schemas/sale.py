from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, Field


class SaleItemCreate(BaseModel):
    product_id: str
    quantity: int = Field(..., gt=0)
    unit_price: Decimal = Field(..., ge=0)


class SaleItemResponse(BaseModel):
    id: str
    product_id: str
    product_name: Optional[str] = None
    product_model: Optional[str] = None
    quantity: int
    unit_price: Decimal
    subtotal: Decimal

    class Config:
        from_attributes = True


class SaleCreate(BaseModel):
    items: List[SaleItemCreate] = Field(..., min_length=1)
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    notes: Optional[str] = None
    sale_date: Optional[datetime] = None


class SaleResponse(BaseModel):
    id: str
    admin_id: Optional[str] = None
    admin_name: Optional[str] = None
    sale_date: datetime
    total_amount: Decimal
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    notes: Optional[str] = None
    status: str
    created_at: datetime
    items: List[SaleItemResponse] = []

    class Config:
        from_attributes = True

