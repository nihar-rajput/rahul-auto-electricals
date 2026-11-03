from typing import List, Optional
from fastapi import APIRouter, Depends, File, HTTPException, Query, Response, UploadFile, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_, desc
import math

from app.db.session import get_db
from app.core.permissions import get_current_active_admin
from app.models.admin_user import AdminUser
from app.models.product import Product
from app.models.brand import Brand
from app.models.product_vehicle_compatibility import ProductVehicleCompatibility
from app.schemas.product import (
    ProductCreate,
    ProductUpdate,
    ProductAdminResponse,
)
from app.schemas.common import MessageResponse, PaginatedResponse
from app.services.product_service import (
    create_product,
    update_product,
    soft_delete_product,
    export_products_csv,
    import_products_csv,
)

router = APIRouter()


@router.get("/products", response_model=PaginatedResponse[ProductAdminResponse])
def admin_list_products(
    search: Optional[str] = None,
    category_id: Optional[str] = None,
    brand_id: Optional[str] = None,
    battery_type: Optional[str] = None,
    stock_status: Optional[str] = Query(None, pattern="^(all|low_stock|out_of_stock|in_stock)$"),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_active_admin),
):
    """List all products for admin dashboard with exact inventory and relations."""
    query = (
        db.query(Product)
        .options(
            joinedload(Product.brand),
            joinedload(Product.category),
            joinedload(Product.images),
            joinedload(Product.compatibilities).joinedload(ProductVehicleCompatibility.vehicle),
        )
        .filter(Product.deleted_at.is_(None))
    )

    if search and search.strip():
        term = f"%{search.strip().lower()}%"
        query = query.filter(
            or_(
                func.lower(Product.name).ilike(term),
                func.lower(Product.model).ilike(term),
                func.lower(Product.part_number).ilike(term),
            )
        )

    if category_id:
        query = query.filter(Product.category_id == category_id)

    if brand_id:
        query = query.filter(Product.brand_id == brand_id)

    if battery_type and battery_type.lower() != "all":
        query = query.filter(func.lower(Product.battery_type) == battery_type.lower())

    if stock_status == "out_of_stock":
        query = query.filter(Product.quantity <= 0)
    elif stock_status == "low_stock":
        query = query.filter(Product.quantity > 0, Product.quantity <= Product.low_stock_threshold)
    elif stock_status == "in_stock":
        query = query.filter(Product.quantity > 0)

    total = query.count()
    offset = (page - 1) * size
    products = query.order_by(desc(Product.created_at)).offset(offset).limit(size).all()

    pages = math.ceil(total / size) if size > 0 else 1
    return PaginatedResponse(
        items=[ProductAdminResponse.model_validate(p) for p in products],
        total=total,
        page=page,
        size=size,
        pages=pages,
    )


@router.post("/products", response_model=ProductAdminResponse, status_code=status.HTTP_201_CREATED)
def admin_create_product(
    product_in: ProductCreate,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_active_admin),
):
    """Create a new product with images, vehicle compatibilities, and inventory tracking."""
    product = create_product(db, product_in, admin_id=current_admin.id)
    return ProductAdminResponse.model_validate(product)


@router.get("/products/{product_id}", response_model=ProductAdminResponse)
def admin_get_product(
    product_id: str,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_active_admin),
):
    """Retrieve full product detail for admin inspection or editing."""
    product = (
        db.query(Product)
        .options(
            joinedload(Product.brand),
            joinedload(Product.category),
            joinedload(Product.images),
            joinedload(Product.compatibilities).joinedload(ProductVehicleCompatibility.vehicle),
        )
        .filter(Product.id == product_id)
        .first()
    )
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return ProductAdminResponse.model_validate(product)


@router.put("/products/{product_id}", response_model=ProductAdminResponse)
def admin_update_product(
    product_id: str,
    product_in: ProductUpdate,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_active_admin),
):
    """Update product details, images, and vehicle compatibilities."""
    product = update_product(db, product_id, product_in, admin_id=current_admin.id)
    return ProductAdminResponse.model_validate(product)


@router.delete("/products/{product_id}", response_model=MessageResponse)
def admin_delete_product(
    product_id: str,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_active_admin),
):
    """Soft delete product while preserving historical inventory movements and sales."""
    soft_delete_product(db, product_id)
    return MessageResponse(message="Product deleted successfully")


@router.get("/products/export/csv")
def admin_export_csv(
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_active_admin),
):
    """Download CSV file containing all products and inventory."""
    csv_data = export_products_csv(db)
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=products_inventory.csv"},
    )


@router.post("/products/import/csv")
async def admin_import_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_active_admin),
):
    """Import and bulk update products from an uploaded CSV file."""
    content = await file.read()
    decoded = content.decode("utf-8-sig")  # handle UTF-8 BOM if present
    result = import_products_csv(db, decoded, admin_id=current_admin.id)
    return result

