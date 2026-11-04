from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, func, or_

from app.models.product import Product
from app.models.sale import Sale
from app.models.sale_item import SaleItem
from app.models.inventory_movement import InventoryMovement
from app.models.admin_user import AdminUser
from app.schemas.sale import SaleCreate, SaleResponse, SaleItemResponse


def record_sale(db: Session, admin_id: str, sale_in: SaleCreate) -> SaleResponse:
    """
    Record a manual store sale in an atomic transaction:
    1. Validates available stock for each item
    2. Reduces product quantities
    3. Emits SALE inventory movement records
    4. Persists the Sale and its SaleItems
    """
    if not sale_in.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Sale must contain at least one product"
        )

    sale_items_to_create = []
    total_amount = Decimal("0.00")

    # Process all items within transaction
    for item_in in sale_in.items:
        product = db.query(Product).filter(Product.id == item_in.product_id).with_for_update().first()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID {item_in.product_id} not found"
            )

        if product.quantity < item_in.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for '{product.name}'. Available: {product.quantity}, Requested: {item_in.quantity}"
            )

        prev_qty = product.quantity
        new_qty = prev_qty - item_in.quantity
        product.quantity = new_qty

        subtotal = Decimal(str(item_in.quantity)) * Decimal(str(item_in.unit_price))
        total_amount += subtotal

        # Create audit movement for this product
        movement = InventoryMovement(
            product_id=product.id,
            admin_id=admin_id,
            movement_type="SALE",
            quantity_change=-item_in.quantity,
            previous_quantity=prev_qty,
            new_quantity=new_qty,
            reason=f"Sale to {sale_in.customer_name or 'Walk-in Customer'}",
        )
        db.add(movement)

        sale_items_to_create.append({
            "product_id": product.id,
            "quantity": item_in.quantity,
            "unit_price": item_in.unit_price,
            "subtotal": subtotal,
            "part_number": item_in.part_number,
            "product_name": product.name,
            "product_model": product.model,
        })

    # Create the master sale record
    sale = Sale(
        admin_id=admin_id,
        sale_date=sale_in.sale_date or datetime.now(timezone.utc),
        total_amount=total_amount,
        customer_name=sale_in.customer_name,
        customer_phone=sale_in.customer_phone,
        notes=sale_in.notes,
        status="COMPLETED",
    )
    db.add(sale)
    db.flush()

    response_items = []
    for item_data in sale_items_to_create:
        db_item = SaleItem(
            sale_id=sale.id,
            product_id=item_data["product_id"],
            quantity=item_data["quantity"],
            unit_price=item_data["unit_price"],
            subtotal=item_data["subtotal"],
            part_number=item_data["part_number"],
        )
        db.add(db_item)
        db.flush()

        response_items.append(
            SaleItemResponse(
                id=db_item.id,
                product_id=item_data["product_id"],
                product_name=item_data["product_name"],
                product_model=item_data["product_model"],
                part_number=item_data["part_number"],
                quantity=item_data["quantity"],
                unit_price=item_data["unit_price"],
                subtotal=item_data["subtotal"],
            )
        )

    db.commit()
    db.refresh(sale)

    admin = db.query(AdminUser).filter(AdminUser.id == admin_id).first()

    return SaleResponse(
        id=sale.id,
        admin_id=sale.admin_id,
        admin_name=admin.name if admin else "Admin",
        sale_date=sale.sale_date,
        total_amount=sale.total_amount,
        customer_name=sale.customer_name,
        customer_phone=sale.customer_phone,
        notes=sale.notes,
        status=sale.status,
        created_at=sale.created_at,
        items=response_items,
    )


def cancel_sale(db: Session, admin_id: str, sale_id: str, reason: str = "Admin cancellation") -> SaleResponse:
    """
    Cancel an existing sale:
    1. Validates that sale is COMPLETED
    2. Restores inventory quantity for each item
    3. Emits SALE_CANCELLATION movements
    4. Marks sale as CANCELLED
    """
    sale = (
        db.query(Sale)
        .options(joinedload(Sale.items).joinedload(SaleItem.product), joinedload(Sale.admin))
        .filter(Sale.id == sale_id)
        .with_for_update()
        .first()
    )
    if not sale:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sale not found")

    if sale.status == "CANCELLED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Sale is already cancelled"
        )

    # Reverse stock for each sale item
    for item in sale.items:
        product = db.query(Product).filter(Product.id == item.product_id).with_for_update().first()
        if product:
            prev_qty = product.quantity
            new_qty = prev_qty + item.quantity
            product.quantity = new_qty

            movement = InventoryMovement(
                product_id=product.id,
                admin_id=admin_id,
                movement_type="SALE_CANCELLATION",
                quantity_change=+item.quantity,
                previous_quantity=prev_qty,
                new_quantity=new_qty,
                reason=f"Sale #{sale.id[:8]} cancelled: {reason}",
            )
            db.add(movement)

    sale.status = "CANCELLED"
    sale.notes = f"{sale.notes or ''}\n[Cancelled]: {reason}".strip()
    sale.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(sale)

    response_items = [
        SaleItemResponse(
            id=item.id,
            product_id=item.product_id,
            product_name=item.product.name if item.product else "Product",
            product_model=item.product.model if item.product else None,
            part_number=item.part_number,
            quantity=item.quantity,
            unit_price=item.unit_price,
            subtotal=item.subtotal,
        )
        for item in sale.items
    ]

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
        items=response_items,
    )


def list_sales(
    db: Session,
    search: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    status_filter: Optional[str] = None,
    page: int = 1,
    size: int = 20,
) -> Tuple[List[SaleResponse], int, Decimal]:
    """List sales with date filters, search, and calculate aggregate revenue."""
    query = (
        db.query(Sale)
        .options(
            joinedload(Sale.items).joinedload(SaleItem.product),
            joinedload(Sale.admin)
        )
    )

    if status_filter:
        query = query.filter(Sale.status == status_filter)

    if start_date:
        query = query.filter(Sale.sale_date >= start_date)

    if end_date:
        query = query.filter(Sale.sale_date <= end_date)

    if search and search.strip():
        term = f"%{search.strip().lower()}%"
        query = query.filter(
            or_(
                func.lower(Sale.customer_name).ilike(term),
                func.lower(Sale.customer_phone).ilike(term),
                func.lower(Sale.id).ilike(term),
                Sale.items.any(func.lower(SaleItem.part_number).ilike(term)),
            )
        )

    # Aggregate total sales revenue for COMPLETED sales in current filter
    revenue_query = (
        db.query(func.coalesce(func.sum(Sale.total_amount), 0))
        .filter(Sale.status == "COMPLETED")
    )
    if start_date:
        revenue_query = revenue_query.filter(Sale.sale_date >= start_date)
    if end_date:
        revenue_query = revenue_query.filter(Sale.sale_date <= end_date)
    total_revenue = Decimal(str(revenue_query.scalar()))

    total = query.count()
    offset = (page - 1) * size
    sales = query.order_by(desc(Sale.sale_date)).offset(offset).limit(size).all()

    items = []
    for s in sales:
        items.append(
            SaleResponse(
                id=s.id,
                admin_id=s.admin_id,
                admin_name=s.admin.name if s.admin else "Admin",
                sale_date=s.sale_date,
                total_amount=s.total_amount,
                customer_name=s.customer_name,
                customer_phone=s.customer_phone,
                notes=s.notes,
                status=s.status,
                created_at=s.created_at,
                items=[
                    SaleItemResponse(
                        id=it.id,
                        product_id=it.product_id,
                        product_name=it.product.name if it.product else "Deleted Product",
                        product_model=it.product.model if it.product else None,
                        part_number=it.part_number,
                        quantity=it.quantity,
                        unit_price=it.unit_price,
                        subtotal=it.subtotal,
                    )
                    for it in s.items
                ],
            )
        )

    return items, total, total_revenue

