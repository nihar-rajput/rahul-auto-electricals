from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
import math

from app.db.session import get_db
from app.core.permissions import get_current_active_admin
from app.models.admin_user import AdminUser
from app.models.product import Product
from app.schemas.inventory import (
    InventoryAdjustRequest,
    InventoryMovementResponse,
)
from app.schemas.common import PaginatedResponse
from app.services.inventory_service import (
    adjust_stock,
    get_inventory_movements,
)

router = APIRouter()


@router.get("/inventory")
def get_inventory_summary(
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_active_admin),
):
    """Get stock overview metrics and stock status breakdowns."""
    total_products = db.query(Product).filter(Product.deleted_at.is_(None)).count()
    total_stock_units = db.query(func.coalesce(func.sum(Product.quantity), 0)).filter(Product.deleted_at.is_(None)).scalar()
    
    out_of_stock_count = (
        db.query(Product)
        .filter(Product.deleted_at.is_(None), Product.quantity <= 0)
        .count()
    )
    low_stock_count = (
        db.query(Product)
        .filter(Product.deleted_at.is_(None), Product.quantity > 0, Product.quantity <= Product.low_stock_threshold)
        .count()
    )
    in_stock_count = (
        db.query(Product)
        .filter(Product.deleted_at.is_(None), Product.quantity > Product.low_stock_threshold)
        .count()
    )

    return {
        "total_products": total_products,
        "total_stock_units": total_stock_units,
        "in_stock_count": in_stock_count,
        "low_stock_count": low_stock_count,
        "out_of_stock_count": out_of_stock_count,
    }


@router.post("/inventory/adjust", response_model=InventoryMovementResponse)
def adjust_inventory(
    adjust_in: InventoryAdjustRequest,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_active_admin),
):
    """
    Adjust stock quantity:
    RESTOCK: Add stock
    MANUAL_REMOVAL: Remove damaged or transferred stock
    CORRECTION: Reconcile physical count
    Enforces non-negative stock and generates immutable audit entry.
    """
    return adjust_stock(db, current_admin.id, adjust_in)


@router.get("/inventory/movements", response_model=PaginatedResponse[InventoryMovementResponse])
def list_movements(
    product_id: Optional[str] = None,
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_active_admin),
):
    """Retrieve immutable audit log of inventory movements."""
    items, total = get_inventory_movements(db, product_id=product_id, page=page, size=size)
    pages = math.ceil(total / size) if size > 0 else 1
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        size=size,
        pages=pages,
    )

