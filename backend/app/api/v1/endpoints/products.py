from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
import math

from app.db.session import get_db
from app.models.brand import Brand
from app.models.product_category import ProductCategory
from app.schemas.brand import BrandResponse
from app.schemas.category import ProductCategoryResponse
from app.schemas.product import ProductPublicResponse
from app.schemas.common import PaginatedResponse
from app.services.product_service import (
    get_public_products,
    get_public_product_by_slug,
)

router = APIRouter()


@router.get("/products", response_model=PaginatedResponse[ProductPublicResponse])
def list_products(
    search: Optional[str] = None,
    battery_type: Optional[str] = None,
    brand: Optional[str] = None,
    in_stock: Optional[bool] = None,
    price_min: Optional[Decimal] = None,
    price_max: Optional[Decimal] = None,
    sort_by: Optional[str] = Query(default="newest", pattern="^(newest|price_asc|price_desc|name_asc|name_desc)$"),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=12, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """
    Public battery catalog endpoint:
    Searches across products, models, part numbers, brands, and vehicle compatibility.
    Respects stock visibility modes configured per-product or globally.
    """
    items, total = get_public_products(
        db=db,
        search=search,
        battery_type=battery_type,
        brand_slug=brand,
        in_stock_only=in_stock,
        price_min=price_min,
        price_max=price_max,
        sort_by=sort_by,
        page=page,
        size=size,
    )
    pages = math.ceil(total / size) if size > 0 else 1
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        size=size,
        pages=pages,
    )


@router.get("/products/{slug}", response_model=ProductPublicResponse)
def get_product(slug: str, db: Session = Depends(get_db)):
    """Retrieve single public product details by slug."""
    product = get_public_product_by_slug(db, slug)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product


@router.get("/brands", response_model=List[BrandResponse])
def list_brands(db: Session = Depends(get_db)):
    """List all active battery brands."""
    brands = db.query(Brand).filter(Brand.is_active.is_(True)).order_by(Brand.name).all()
    return [BrandResponse.model_validate(b) for b in brands]


@router.get("/categories", response_model=List[ProductCategoryResponse])
def list_categories(db: Session = Depends(get_db)):
    """List product categories."""
    categories = db.query(ProductCategory).order_by(ProductCategory.name).all()
    return [ProductCategoryResponse.model_validate(c) for c in categories]

