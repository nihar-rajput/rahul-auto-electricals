from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.vehicle import VehicleResponse
from app.schemas.product import ProductPublicResponse
from app.services.vehicle_service import (
    get_all_vehicles,
    get_manufacturers,
    get_models_by_manufacturer,
    search_vehicles,
    get_compatible_batteries_for_vehicle,
)

router = APIRouter()


@router.get("/vehicles", response_model=List[VehicleResponse])
def get_vehicles(db: Session = Depends(get_db)):
    """List all vehicles in the database."""
    return get_all_vehicles(db)


@router.get("/vehicles/manufacturers", response_model=List[str])
def list_manufacturers(db: Session = Depends(get_db)):
    """List unique vehicle manufacturers (e.g. Maruti Suzuki, Hyundai, Honda, Tata)."""
    return get_manufacturers(db)


@router.get("/vehicles/models", response_model=List[str])
def list_models(manufacturer: str = Query(...), db: Session = Depends(get_db)):
    """List vehicle models for a specific manufacturer."""
    return get_models_by_manufacturer(db, manufacturer)


@router.get("/vehicles/search", response_model=List[VehicleResponse])
def search_veh(q: str = Query(..., min_length=1), db: Session = Depends(get_db)):
    """Search vehicles by manufacturer or model query."""
    return search_vehicles(db, q)


@router.get("/vehicles/compatible-batteries", response_model=List[ProductPublicResponse])
def find_compatible_batteries(
    manufacturer: str = Query(...),
    model: str = Query(...),
    year: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Find batteries compatible with a specific vehicle make, model, and year.
    Used by the vehicle finder tool on the homepage.
    """
    return get_compatible_batteries_for_vehicle(db, manufacturer, model, year)

