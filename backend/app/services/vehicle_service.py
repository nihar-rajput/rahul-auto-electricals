from typing import Any, Dict, List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_

from app.models.vehicle import Vehicle
from app.models.product import Product
from app.models.product_vehicle_compatibility import ProductVehicleCompatibility
from app.schemas.vehicle import VehicleCreate, VehicleUpdate, VehicleResponse
from app.schemas.product import ProductPublicResponse
from app.services.product_service import to_public_product
from app.services.settings_service import get_or_create_settings


def get_all_vehicles(db: Session) -> List[VehicleResponse]:
    """Retrieve all distinct vehicle records."""
    vehicles = db.query(Vehicle).order_by(Vehicle.manufacturer, Vehicle.model).all()
    return [VehicleResponse.model_validate(v) for v in vehicles]


def get_manufacturers(db: Session) -> List[str]:
    """Get list of unique vehicle manufacturers."""
    results = (
        db.query(Vehicle.manufacturer)
        .distinct()
        .order_by(Vehicle.manufacturer)
        .all()
    )
    return [r[0] for r in results]


def get_models_by_manufacturer(db: Session, manufacturer: str) -> List[str]:
    """Get list of unique vehicle models for a given manufacturer."""
    results = (
        db.query(Vehicle.model)
        .filter(func.lower(Vehicle.manufacturer) == manufacturer.strip().lower())
        .distinct()
        .order_by(Vehicle.model)
        .all()
    )
    return [r[0] for r in results]


def search_vehicles(db: Session, query: str) -> List[VehicleResponse]:
    """Search vehicles by manufacturer or model."""
    term = f"%{query.strip().lower()}%"
    vehicles = (
        db.query(Vehicle)
        .filter(
            or_(
                func.lower(Vehicle.manufacturer).ilike(term),
                func.lower(Vehicle.model).ilike(term),
            )
        )
        .order_by(Vehicle.manufacturer, Vehicle.model)
        .limit(20)
        .all()
    )
    return [VehicleResponse.model_validate(v) for v in vehicles]


def get_compatible_batteries_for_vehicle(
    db: Session,
    manufacturer: str,
    model: str,
    year: Optional[int] = None
) -> List[ProductPublicResponse]:
    """Find all published batteries compatible with specified vehicle and optional year."""
    global_settings = get_or_create_settings(db)

    # Find vehicle matching manufacturer and model
    vehicle_query = db.query(Vehicle).filter(
        func.lower(Vehicle.manufacturer) == manufacturer.strip().lower(),
        func.lower(Vehicle.model) == model.strip().lower(),
    )
    matching_vehicles = vehicle_query.all()
    if not matching_vehicles:
        return []

    vehicle_ids = [v.id for v in matching_vehicles]

    # Find compatibilities
    comp_query = (
        db.query(ProductVehicleCompatibility.product_id)
        .filter(ProductVehicleCompatibility.vehicle_id.in_(vehicle_ids))
    )

    if year:
        comp_query = comp_query.filter(
            or_(
                ProductVehicleCompatibility.compatible_from_year.is_(None),
                ProductVehicleCompatibility.compatible_from_year <= year,
            ),
            or_(
                ProductVehicleCompatibility.compatible_to_year.is_(None),
                ProductVehicleCompatibility.compatible_to_year >= year,
            ),
        )

    product_ids = [r[0] for r in comp_query.distinct().all()]
    if not product_ids:
        return []

    products = (
        db.query(Product)
        .options(
            joinedload(Product.brand),
            joinedload(Product.category),
            joinedload(Product.images),
            joinedload(Product.compatibilities).joinedload(ProductVehicleCompatibility.vehicle),
        )
        .filter(Product.id.in_(product_ids))
        .filter(Product.deleted_at.is_(None))
        .filter(Product.is_published.is_(True))
        .all()
    )

    return [to_public_product(p, global_settings) for p in products]


def create_vehicle(db: Session, vehicle_in: VehicleCreate) -> VehicleResponse:
    """Create a new vehicle record."""
    vehicle = Vehicle(
        manufacturer=vehicle_in.manufacturer.strip(),
        model=vehicle_in.model.strip(),
        year=vehicle_in.year,
        fuel_type=vehicle_in.fuel_type,
    )
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return VehicleResponse.model_validate(vehicle)


def update_vehicle(db: Session, vehicle_id: str, vehicle_in: VehicleUpdate) -> VehicleResponse:
    """Update a vehicle record."""
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")

    update_data = vehicle_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if value is not None:
            setattr(vehicle, key, value.strip() if isinstance(value, str) else value)

    db.commit()
    db.refresh(vehicle)
    return VehicleResponse.model_validate(vehicle)


def delete_vehicle(db: Session, vehicle_id: str) -> bool:
    """Delete a vehicle record."""
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")

    db.delete(vehicle)
    db.commit()
    return True

