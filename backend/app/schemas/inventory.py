from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class InventoryAdjustRequest(BaseModel):
    product_id: str
    movement_type: str = Field(..., pattern="^(RESTOCK|MANUAL_REMOVAL|CORRECTION)$")
    quantity_change: int
    reason: str = Field(..., min_length=3, max_length=500)


class InventoryMovementResponse(BaseModel):
    id: str
    product_id: str
    product_name: Optional[str] = None
    product_model: Optional[str] = None
    admin_id: Optional[str] = None
    admin_name: Optional[str] = None
    movement_type: str
    quantity_change: int
    previous_quantity: int
    new_quantity: int
    reason: str
    created_at: datetime

    class Config:
        from_attributes = True

