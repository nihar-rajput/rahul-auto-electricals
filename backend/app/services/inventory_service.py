from typing import List, Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc

from app.models.product import Product
from app.models.inventory_movement import InventoryMovement
from app.models.admin_user import AdminUser
from app.schemas.inventory import InventoryAdjustRequest, InventoryMovementResponse


def adjust_stock(
    db: Session,
    admin_id: str,
    adjust_in: InventoryAdjustRequest
) -> InventoryMovementResponse:
    """
    Adjust product stock with full audit tracking.
    Enforces non-negative inventory and creates immutable movement record.
    """
    # Find product
    product = db.query(Product).filter(Product.id == adjust_in.product_id).with_for_update().first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )

    previous_quantity = product.quantity
    change = adjust_in.quantity_change
    m_type = adjust_in.movement_type

    # Calculate new quantity based on movement type
    if m_type == "RESTOCK":
        if change <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Restock quantity must be positive"
            )
        new_quantity = previous_quantity + change
    elif m_type == "MANUAL_REMOVAL":
        if change <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Removal quantity must be positive"
            )
        new_quantity = previous_quantity - change
        change = -change
    elif m_type == "CORRECTION":
        # For correction, change is the signed difference
        new_quantity = previous_quantity + change
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported movement type: {m_type}"
        )

    # Prevent negative inventory
    if new_quantity < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot reduce stock below zero. Current stock: {previous_quantity}, attempted change: {change}"
        )

    # Update product quantity
    product.quantity = new_quantity

    # Create immutable inventory movement
    movement = InventoryMovement(
        product_id=product.id,
        admin_id=admin_id,
        movement_type=m_type,
        quantity_change=change,
        previous_quantity=previous_quantity,
        new_quantity=new_quantity,
        reason=adjust_in.reason,
    )
    db.add(movement)
    db.commit()
    db.refresh(movement)

    admin = db.query(AdminUser).filter(AdminUser.id == admin_id).first()

    return InventoryMovementResponse(
        id=movement.id,
        product_id=product.id,
        product_name=product.name,
        product_model=product.model,
        admin_id=admin_id,
        admin_name=admin.name if admin else "Admin",
        movement_type=movement.movement_type,
        quantity_change=movement.quantity_change,
        previous_quantity=movement.previous_quantity,
        new_quantity=movement.new_quantity,
        reason=movement.reason,
        created_at=movement.created_at,
    )


def get_inventory_movements(
    db: Session,
    product_id: Optional[str] = None,
    page: int = 1,
    size: int = 20,
) -> Tuple[List[InventoryMovementResponse], int]:
    """Retrieve audit history of stock adjustments."""
    query = (
        db.query(InventoryMovement)
        .options(
            joinedload(InventoryMovement.product),
            joinedload(InventoryMovement.admin)
        )
    )

    if product_id:
        query = query.filter(InventoryMovement.product_id == product_id)

    total = query.count()
    offset = (page - 1) * size
    movements = query.order_by(desc(InventoryMovement.created_at)).offset(offset).limit(size).all()

    items = []
    for m in movements:
        items.append(
            InventoryMovementResponse(
                id=m.id,
                product_id=m.product_id,
                product_name=m.product.name if m.product else "Deleted Product",
                product_model=m.product.model if m.product else None,
                admin_id=m.admin_id,
                admin_name=m.admin.name if m.admin else "System/Admin",
                movement_type=m.movement_type,
                quantity_change=m.quantity_change,
                previous_quantity=m.previous_quantity,
                new_quantity=m.new_quantity,
                reason=m.reason,
                created_at=m.created_at,
            )
        )

    return items, total

