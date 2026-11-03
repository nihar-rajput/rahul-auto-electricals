from datetime import datetime
from decimal import Decimal
from typing import Optional
from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
import math

from app.db.session import get_db
from app.core.permissions import get_current_active_admin
from app.models.admin_user import AdminUser
from app.models.sale import Sale
from app.models.sale_item import SaleItem
from app.schemas.sale import (
    SaleCreate,
    SaleResponse,
    SaleItemResponse,
)
from app.schemas.common import PaginatedResponse
from app.services.sales_service import (
    record_sale,
    cancel_sale,
    list_sales,
)

router = APIRouter()


class SalesPaginatedResponse(PaginatedResponse[SaleResponse]):
    total_revenue: Decimal


@router.get("/sales", response_model=SalesPaginatedResponse)
def get_sales(
    search: Optional[str] = None,
    status_filter: Optional[str] = Query(None, pattern="^(COMPLETED|CANCELLED)$"),
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_active_admin),
):
    """List manual store sales with search, date range, and revenue aggregation."""
    items, total, total_revenue = list_sales(
        db=db,
        search=search,
        start_date=start_date,
        end_date=end_date,
        status_filter=status_filter,
        page=page,
        size=size,
    )
    pages = math.ceil(total / size) if size > 0 else 1
    return SalesPaginatedResponse(
        items=items,
        total=total,
        total_revenue=total_revenue,
        page=page,
        size=size,
        pages=pages,
    )


@router.post("/sales", response_model=SaleResponse, status_code=status.HTTP_201_CREATED)
def create_sale(
    sale_in: SaleCreate,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_active_admin),
):
    """
    Record a manual customer sale:
    Validates stock, creates Sale record, reduces stock quantities atomically,
    and logs SALE inventory movements.
    """
    return record_sale(db, current_admin.id, sale_in)


@router.get("/sales/{sale_id}", response_model=SaleResponse)
def get_sale_detail(
    sale_id: str,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_active_admin),
):
    """Retrieve detailed sale record including items."""
    sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sale not found")

    return SaleResponse(
        id=sale.id,
        admin_id=sale.admin_id,
        admin_name=sale.admin.name if sale.admin else "Admin",
        sale_date=sale.sale_date,
        total_amount=sale.total_amount,
        customer_name=sale.customer_name,
        customer_phone=sale.customer_phone,
        notes=sale.notes,
        status=sale.status,
        created_at=sale.created_at,
        items=[
            SaleItemResponse(
                id=it.id,
                product_id=it.product_id,
                product_name=it.product.name if it.product else "Product",
                product_model=it.product.model if it.product else None,
                quantity=it.quantity,
                unit_price=it.unit_price,
                subtotal=it.subtotal,
            )
            for it in sale.items
        ],
    )


@router.post("/sales/{sale_id}/cancel", response_model=SaleResponse)
def cancel_sale_endpoint(
    sale_id: str,
    reason: str = Body(default="Admin requested cancellation", embed=True),
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_active_admin),
):
    """
    Cancel an existing sale:
    Reverses the sold quantities back into inventory and creates
    SALE_CANCELLATION movement records.
    """
    return cancel_sale(db, current_admin.id, sale_id, reason)

