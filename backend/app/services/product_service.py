import csv
import io
import re
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, Dict, List, Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy import or_, and_, func, desc, asc
from sqlalchemy.orm import Session, joinedload

from app.models.product import Product
from app.models.brand import Brand
from app.models.product_category import ProductCategory
from app.models.product_image import ProductImage
from app.models.vehicle import Vehicle
from app.models.product_vehicle_compatibility import ProductVehicleCompatibility
from app.models.website_settings import WebsiteSettings
from app.models.inventory_movement import InventoryMovement
from app.schemas.product import (
    ProductCreate,
    ProductUpdate,
    ProductPublicResponse,
    ProductAdminResponse,
)
from app.services.settings_service import get_or_create_settings


def generate_slug(text: str) -> str:
    """Generate a clean URL-friendly slug."""
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    return text.strip("-")


def get_unique_slug(db: Session, base_name: str, current_id: Optional[str] = None) -> str:
    """Ensure slug uniqueness across products."""
    base_slug = generate_slug(base_name)
    slug = base_slug
    counter = 1
    while True:
        query = db.query(Product).filter(Product.slug == slug)
        if current_id:
            query = query.filter(Product.id != current_id)
        if not query.first():
            return slug
        slug = f"{base_slug}-{counter}"
        counter += 1


def format_public_stock_status(
    product: Product,
    global_settings: WebsiteSettings
) -> Tuple[bool, str, Optional[int]]:
    """
    Format stock for public view based on 3 modes:
    1. EXACT_QUANTITY: e.g. "12 units available"
    2. SIMPLE_STATUS: "In Stock" or "Out of Stock"
    3. STOCK_LEVEL: "Low Stock", "In Stock", or "Out of Stock"
    """
    qty = product.quantity
    if qty <= 0:
        return False, "Out of Stock", None

    mode = product.stock_visibility_mode or global_settings.default_stock_visibility_mode
    threshold = product.low_stock_threshold or global_settings.default_low_stock_threshold

    if mode == "EXACT_QUANTITY":
        return True, f"{qty} units available", qty
    elif mode == "STOCK_LEVEL":
        if qty <= threshold:
            return True, "Low Stock", None
        return True, "In Stock", None
    else:  # SIMPLE_STATUS default
        return True, "In Stock", None


def to_public_product(product: Product, global_settings: WebsiteSettings) -> ProductPublicResponse:
    """Convert DB Product to public sanitized schema with stock visibility rules."""
    is_in_stock, stock_status_text, display_qty = format_public_stock_status(product, global_settings)

    return ProductPublicResponse(
        id=product.id,
        name=product.name,
        slug=product.slug,
        brand=product.brand,
        category=product.category,
        model=product.model,
        part_number=product.part_number,
        battery_type=product.battery_type,
        description=product.description,
        price=product.price,
        voltage=product.voltage,
        ah_capacity=product.ah_capacity,
        warranty_duration=product.warranty_duration,
        guarantee_details=product.guarantee_details,
        is_in_stock=is_in_stock,
        stock_status_text=stock_status_text,
        display_quantity=display_qty,
        images=product.images,
        compatibilities=product.compatibilities,
    )


def get_public_products(
    db: Session,
    search: Optional[str] = None,
    battery_type: Optional[str] = None,
    brand_slug: Optional[str] = None,
    in_stock_only: Optional[bool] = None,
    price_min: Optional[Decimal] = None,
    price_max: Optional[Decimal] = None,
    sort_by: Optional[str] = "newest",
    page: int = 1,
    size: int = 12,
) -> Tuple[List[ProductPublicResponse], int]:
    """Retrieve filtered, searched, sorted public products."""
    global_settings = get_or_create_settings(db)
    query = (
        db.query(Product)
        .options(
            joinedload(Product.brand),
            joinedload(Product.category),
            joinedload(Product.images),
            joinedload(Product.compatibilities).joinedload(ProductVehicleCompatibility.vehicle),
        )
        .filter(Product.deleted_at.is_(None))
        .filter(Product.is_published.is_(True))
    )

    # Battery type filter
    if battery_type and battery_type.lower() != "all":
        query = query.filter(func.lower(Product.battery_type) == battery_type.lower())

    # Brand filter
    if brand_slug and brand_slug.lower() != "all":
        query = query.join(Product.brand).filter(func.lower(Brand.slug) == brand_slug.lower())

    # In stock filter
    if in_stock_only is True:
        query = query.filter(Product.quantity > 0)

    # Price range
    if price_min is not None:
        query = query.filter(Product.price >= price_min)
    if price_max is not None:
        query = query.filter(Product.price <= price_max)

    # Search keyword matches name, model, part_number, brand name, OR compatible vehicle
    if search and search.strip():
        term = f"%{search.strip().lower()}%"
        # Find product IDs compatible with matching vehicles
        vehicle_match_subquery = (
            db.query(ProductVehicleCompatibility.product_id)
            .join(Vehicle, ProductVehicleCompatibility.vehicle_id == Vehicle.id)
            .filter(
                or_(
                    func.lower(Vehicle.manufacturer).ilike(term),
                    func.lower(Vehicle.model).ilike(term),
                )
            )
        )

        query = query.outerjoin(Brand, Product.brand_id == Brand.id).filter(
            or_(
                func.lower(Product.name).ilike(term),
                func.lower(Product.model).ilike(term),
                func.lower(Product.part_number).ilike(term),
                func.lower(Brand.name).ilike(term),
                Product.id.in_(vehicle_match_subquery),
            )
        )

    # Total count before pagination
    total = query.distinct().count()

    # Sorting
    if sort_by == "price_asc":
        query = query.order_by(asc(Product.price))
    elif sort_by == "price_desc":
        query = query.order_by(desc(Product.price))
    elif sort_by == "name_asc":
        query = query.order_by(asc(Product.name))
    elif sort_by == "name_desc":
        query = query.order_by(desc(Product.name))
    else:  # newest default
        query = query.order_by(desc(Product.created_at))

    offset = (page - 1) * size
    products = query.distinct().offset(offset).limit(size).all()

    public_items = [to_public_product(p, global_settings) for p in products]
    return public_items, total


def get_public_product_by_slug(db: Session, slug: str) -> Optional[ProductPublicResponse]:
    """Retrieve single public product by slug."""
    global_settings = get_or_create_settings(db)
    product = (
        db.query(Product)
        .options(
            joinedload(Product.brand),
            joinedload(Product.category),
            joinedload(Product.images),
            joinedload(Product.compatibilities).joinedload(ProductVehicleCompatibility.vehicle),
        )
        .filter(Product.slug == slug)
        .filter(Product.deleted_at.is_(None))
        .filter(Product.is_published.is_(True))
        .first()
    )
    if not product:
        return None
    return to_public_product(product, global_settings)


def create_product(db: Session, product_in: ProductCreate, admin_id: Optional[str] = None) -> Product:
    """Create a new product with optional images, vehicles, and initial inventory movement."""
    # Ensure brand and category exist
    brand = db.query(Brand).filter(Brand.id == product_in.brand_id).first()
    if not brand:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Brand not found")

    category = db.query(ProductCategory).filter(ProductCategory.id == product_in.category_id).first()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    slug = product_in.slug or get_unique_slug(db, product_in.name)

    product = Product(
        name=product_in.name,
        slug=slug,
        brand_id=product_in.brand_id,
        category_id=product_in.category_id,
        model=product_in.model,
        part_number=product_in.part_number,
        battery_type=product_in.battery_type,
        description=product_in.description,
        price=product_in.price,
        quantity=product_in.quantity,
        voltage=product_in.voltage,
        ah_capacity=product_in.ah_capacity,
        warranty_duration=product_in.warranty_duration,
        guarantee_details=product_in.guarantee_details,
        low_stock_threshold=product_in.low_stock_threshold,
        stock_visibility_mode=product_in.stock_visibility_mode,
        is_published=product_in.is_published,
    )
    db.add(product)
    db.flush()

    # Add images
    if product_in.images:
        for idx, img in enumerate(product_in.images):
            db_img = ProductImage(
                product_id=product.id,
                image_url=img.image_url,
                is_primary=img.is_primary if idx > 0 else True,
                display_order=img.display_order or idx,
            )
            db.add(db_img)

    # Add vehicle compatibility
    if product_in.compatibilities:
        for comp in product_in.compatibilities:
            db_comp = ProductVehicleCompatibility(
                product_id=product.id,
                vehicle_id=comp.vehicle_id,
                compatible_from_year=comp.compatible_from_year,
                compatible_to_year=comp.compatible_to_year,
                notes=comp.notes,
            )
            db.add(db_comp)

    # Record initial stock movement if quantity > 0
    if product.quantity > 0:
        movement = InventoryMovement(
            product_id=product.id,
            admin_id=admin_id,
            movement_type="RESTOCK",
            quantity_change=product.quantity,
            previous_quantity=0,
            new_quantity=product.quantity,
            reason="Initial stock on product creation",
        )
        db.add(movement)

    db.commit()
    db.refresh(product)
    return product


def update_product(
    db: Session,
    product_id: str,
    product_in: ProductUpdate,
    admin_id: Optional[str] = None
) -> Product:
    """Update an existing product and reconcile images/compatibilities."""
    product = (
        db.query(Product)
        .options(
            joinedload(Product.images),
            joinedload(Product.compatibilities),
        )
        .filter(Product.id == product_id)
        .filter(Product.deleted_at.is_(None))
        .first()
    )
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    update_data = product_in.model_dump(exclude_unset=True)

    # If name changed and no slug provided, update slug
    if "name" in update_data and "slug" not in update_data:
        update_data["slug"] = get_unique_slug(db, update_data["name"], current_id=product.id)

    # If quantity changed directly in product update, record CORRECTION movement
    if "quantity" in update_data and update_data["quantity"] != product.quantity:
        new_qty = update_data["quantity"]
        diff = new_qty - product.quantity
        movement = InventoryMovement(
            product_id=product.id,
            admin_id=admin_id,
            movement_type="CORRECTION",
            quantity_change=diff,
            previous_quantity=product.quantity,
            new_quantity=new_qty,
            reason="Stock adjusted via Product Editor",
        )
        db.add(movement)

    # Reconcile images if passed
    if "images" in update_data and update_data["images"] is not None:
        db.query(ProductImage).filter(ProductImage.product_id == product.id).delete()
        for idx, img in enumerate(update_data["images"]):
            db_img = ProductImage(
                product_id=product.id,
                image_url=img["image_url"],
                is_primary=img.get("is_primary", idx == 0),
                display_order=img.get("display_order", idx),
            )
            db.add(db_img)

    # Reconcile compatibilities if passed
    if "compatibilities" in update_data and update_data["compatibilities"] is not None:
        db.query(ProductVehicleCompatibility).filter(ProductVehicleCompatibility.product_id == product.id).delete()
        for comp in update_data["compatibilities"]:
            db_comp = ProductVehicleCompatibility(
                product_id=product.id,
                vehicle_id=comp["vehicle_id"],
                compatible_from_year=comp.get("compatible_from_year"),
                compatible_to_year=comp.get("compatible_to_year"),
                notes=comp.get("notes"),
            )
            db.add(db_comp)

    # Update simple scalar fields
    for field, value in update_data.items():
        if field not in ("images", "compatibilities"):
            setattr(product, field, value)

    product.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(product)
    return product


def soft_delete_product(db: Session, product_id: str) -> bool:
    """Soft-delete product preserving inventory history."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    product.deleted_at = datetime.now(timezone.utc)
    product.is_published = False
    db.commit()
    return True


def export_products_csv(db: Session) -> str:
    """Export all non-deleted products to CSV format."""
    products = (
        db.query(Product)
        .options(joinedload(Product.brand), joinedload(Product.category))
        .filter(Product.deleted_at.is_(None))
        .order_by(Product.name)
        .all()
    )

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Name", "Brand", "Category", "Model", "Battery Type",
        "Price", "Quantity", "Warranty",
        "Guarantee Details", "Low Stock Threshold", "Stock Visibility Mode", "Is Published", "Description"
    ])

    for p in products:
        writer.writerow([
            p.name,
            p.brand.name if p.brand else "",
            p.category.name if p.category else "",
            p.model,
            p.battery_type,
            str(p.price),
            p.quantity,
            p.warranty_duration or "",
            p.guarantee_details or "",
            p.low_stock_threshold,
            p.stock_visibility_mode or "",
            "TRUE" if p.is_published else "FALSE",
            p.description or "",
        ])

    return output.getvalue()


def _normalize_battery_type(val: str) -> str:
    """Normalize common battery type synonyms to schema-compliant values."""
    v = val.lower().strip()
    if any(k in v for k in ["bike", "motorcycle", "scooter", "two", "2-w", "2w"]):
        return "Bike"
    if any(k in v for k in ["truck", "bus", "heavy", "hcv"]):
        return "Truck"
    if any(k in v for k in ["inverter", "ups", "home", "solar", "tubular"]):
        return "Inverter"
    if any(k in v for k in ["commercial", "lcv", "auto", "rickshaw", "tractor"]):
        return "Commercial"
    if "other" in v:
        return "Other"
    return "Car"


def _clean_numeric_str(val: str) -> str:
    """Remove currency symbols, commas, and formatting from numeric strings."""
    if not val:
        return ""
    return re.sub(r"[^0-9.]", "", val)


def import_products_csv(db: Session, csv_content: str, admin_id: Optional[str] = None) -> Dict[str, Any]:
    """Import products from CSV string with flexible header alias matching and auto-brand/category creation."""
    reader = csv.DictReader(io.StringIO(csv_content))
    created = 0
    updated = 0
    errors = []

    def get_field(norm_row: Dict[str, str], aliases: List[str], default: str = "") -> str:
        for alias in aliases:
            if alias in norm_row and norm_row[alias]:
                return norm_row[alias]
        return default

    for idx, raw_row in enumerate(reader, start=2):
        try:
            # Create a normalized lowercase alphanumeric key lookup
            norm = {}
            for k, v in raw_row.items():
                if k is not None:
                    clean_k = re.sub(r"[^a-z0-9]", "", str(k).lower().strip())
                    norm[clean_k] = str(v).strip() if v is not None else ""

            name = get_field(norm, ["name", "productname", "batteryname", "itemname", "title"])
            brand_name = get_field(norm, ["brand", "brandname", "company", "make", "manufacturer"], "PowerZone")
            model = get_field(norm, ["model", "modelno", "modelnumber", "batterymodel", "code"])
            part_number = get_field(norm, ["partnumber", "partno", "barcode", "serial", "serialno", "serialnumber", "sku"]) or None
            
            if not name and model:
                name = f"{brand_name} {model} Battery"
            elif not name and not model:
                errors.append(f"Row {idx}: Name or Model is required")
                continue

            if not model:
                model = name

            raw_type = get_field(norm, ["batterytype", "type", "vehicletype", "application", "vehicle"], "Car")
            battery_type = _normalize_battery_type(raw_type)

            price_str = _clean_numeric_str(get_field(norm, ["price", "mrp", "rate", "cost", "amount", "sellingprice"], "0"))
            price_val = Decimal(price_str or "0")

            qty_str = _clean_numeric_str(get_field(norm, ["quantity", "qty", "stock", "stockquantity", "count"], "0")).split(".")[0]
            quantity_val = int(qty_str or "0")

            voltage = get_field(norm, ["voltage", "volt", "volts"], "12V") or "12V"
            ah_capacity = get_field(norm, ["ahcapacity", "ah", "capacity", "amphour"]) or None
            warranty_duration = get_field(norm, ["warranty", "warrantyduration", "warrantyperiod", "months"]) or None
            guarantee_details = get_field(norm, ["guaranteedetails", "guarantee", "replacement"]) or None

            thresh_str = _clean_numeric_str(get_field(norm, ["lowstockthreshold", "lowstock", "minstock", "threshold"], "5")).split(".")[0]
            low_stock_threshold = int(thresh_str or "5")

            mode_str = get_field(norm, ["stockvisibilitymode", "stockvisibility", "visibility"], "EXACT_COUNT")
            stock_visibility_mode = "IN_STOCK_BADGE" if "badge" in mode_str.lower() else "EXACT_COUNT"

            pub_str = get_field(norm, ["ispublished", "published", "status", "active"], "TRUE")
            is_published = False if pub_str.lower() in ["false", "0", "no", "draft", "hide", "inactive"] else True

            description = get_field(norm, ["description", "desc", "details", "specs"]) or None

            # Ensure brand
            brand = db.query(Brand).filter(func.lower(Brand.name) == brand_name.lower()).first()
            if not brand:
                brand = Brand(name=brand_name, slug=generate_slug(brand_name))
                db.add(brand)
                db.flush()

            # Ensure category
            category_name = get_field(norm, ["category", "categoryname"], "Batteries")
            category = db.query(ProductCategory).filter(func.lower(ProductCategory.name) == category_name.lower()).first()
            if not category:
                category = ProductCategory(name=category_name, slug=generate_slug(category_name))
                db.add(category)
                db.flush()

            # Look up product by part number (if given), model, or exact name
            existing = None
            if part_number:
                existing = (
                    db.query(Product)
                    .filter(Product.deleted_at.is_(None))
                    .filter(Product.part_number == part_number)
                    .first()
                )
            if not existing and model:
                existing = (
                    db.query(Product)
                    .filter(Product.deleted_at.is_(None))
                    .filter(Product.model == model)
                    .first()
                )
            if not existing:
                existing = (
                    db.query(Product)
                    .filter(Product.deleted_at.is_(None))
                    .filter(Product.name == name)
                    .first()
                )

            if existing:
                existing.brand_id = brand.id
                existing.category_id = category.id
                existing.name = name
                existing.price = price_val
                existing.battery_type = battery_type
                if part_number:
                    existing.part_number = part_number
                if voltage:
                    existing.voltage = voltage
                if ah_capacity:
                    existing.ah_capacity = ah_capacity
                if warranty_duration:
                    existing.warranty_duration = warranty_duration
                if guarantee_details:
                    existing.guarantee_details = guarantee_details
                if description:
                    existing.description = description
                existing.low_stock_threshold = low_stock_threshold
                existing.stock_visibility_mode = stock_visibility_mode
                existing.is_published = is_published

                # If quantity changed, log inventory adjustment
                if quantity_val != existing.quantity and quantity_val > 0:
                    diff = quantity_val - existing.quantity
                    existing.quantity = quantity_val
                    db.add(
                        InventoryMovement(
                            product_id=existing.id,
                            admin_id=admin_id,
                            movement_type="RESTOCK" if diff > 0 else "ADJUSTMENT",
                            quantity_change=diff,
                            previous_quantity=existing.quantity - diff,
                            new_quantity=quantity_val,
                            reason=f"Excel/CSV Import update ({'+' if diff > 0 else ''}{diff})",
                        )
                    )
                updated += 1
            else:
                new_prod = Product(
                    name=name,
                    slug=get_unique_slug(db, name),
                    brand_id=brand.id,
                    category_id=category.id,
                    model=model,
                    part_number=part_number,
                    battery_type=battery_type,
                    description=description,
                    price=price_val,
                    quantity=quantity_val,
                    voltage=voltage,
                    ah_capacity=ah_capacity,
                    warranty_duration=warranty_duration,
                    guarantee_details=guarantee_details,
                    low_stock_threshold=low_stock_threshold,
                    stock_visibility_mode=stock_visibility_mode,
                    is_published=is_published,
                )
                db.add(new_prod)
                db.flush()
                if quantity_val > 0:
                    db.add(
                        InventoryMovement(
                            product_id=new_prod.id,
                            admin_id=admin_id,
                            movement_type="RESTOCK",
                            quantity_change=quantity_val,
                            previous_quantity=0,
                            new_quantity=quantity_val,
                            reason="Excel/CSV Import initial stock",
                        )
                    )
                created += 1

        except Exception as e:
            errors.append(f"Row {idx}: {str(e)}")

    db.commit()
    return {"created": created, "updated": updated, "errors": errors}
