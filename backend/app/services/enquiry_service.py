from typing import Any, Dict, List, Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, func, or_
from datetime import datetime, timezone

from app.models.customer_enquiry import CustomerEnquiry
from app.schemas.enquiry import CustomerEnquiryCreate, CustomerEnquiryUpdate, CustomerEnquiryResponse


def create_customer_enquiry(db: Session, enquiry_in: CustomerEnquiryCreate) -> CustomerEnquiryResponse:
    """Save customer battery enquiry or request."""
    enquiry = CustomerEnquiry(
        customer_name=enquiry_in.customer_name,
        phone=enquiry_in.phone,
        vehicle_brand=enquiry_in.vehicle_brand,
        vehicle_model=enquiry_in.vehicle_model,
        vehicle_year=enquiry_in.vehicle_year,
        battery_type=enquiry_in.battery_type,
        preferred_brand=enquiry_in.preferred_brand,
        message=enquiry_in.message,
        status="NEW",
    )
    db.add(enquiry)
    db.commit()
    db.refresh(enquiry)
    return CustomerEnquiryResponse.model_validate(enquiry)


def list_enquiries(
    db: Session,
    status_filter: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 1,
    size: int = 20,
) -> Tuple[List[CustomerEnquiryResponse], int]:
    """Retrieve customer enquiries with status filters and search."""
    query = db.query(CustomerEnquiry)

    if status_filter and status_filter.upper() != "ALL":
        query = query.filter(CustomerEnquiry.status == status_filter.upper())

    if search and search.strip():
        term = f"%{search.strip().lower()}%"
        query = query.filter(
            or_(
                func.lower(CustomerEnquiry.customer_name).ilike(term),
                func.lower(CustomerEnquiry.phone).ilike(term),
                func.lower(CustomerEnquiry.vehicle_brand).ilike(term),
                func.lower(CustomerEnquiry.vehicle_model).ilike(term),
            )
        )

    total = query.count()
    offset = (page - 1) * size
    enquiries = query.order_by(desc(CustomerEnquiry.created_at)).offset(offset).limit(size).all()

    return [CustomerEnquiryResponse.model_validate(e) for e in enquiries], total


def get_enquiry_by_id(db: Session, enquiry_id: str) -> Optional[CustomerEnquiryResponse]:
    """Get single enquiry details."""
    enquiry = db.query(CustomerEnquiry).filter(CustomerEnquiry.id == enquiry_id).first()
    if not enquiry:
        return None
    return CustomerEnquiryResponse.model_validate(enquiry)


def update_enquiry(db: Session, enquiry_id: str, enquiry_in: CustomerEnquiryUpdate) -> CustomerEnquiryResponse:
    """Update enquiry status and internal notes."""
    enquiry = db.query(CustomerEnquiry).filter(CustomerEnquiry.id == enquiry_id).first()
    if not enquiry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Enquiry not found")

    if enquiry_in.status is not None:
        enquiry.status = enquiry_in.status
    if enquiry_in.admin_notes is not None:
        enquiry.admin_notes = enquiry_in.admin_notes

    enquiry.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(enquiry)
    return CustomerEnquiryResponse.model_validate(enquiry)


def delete_enquiry(db: Session, enquiry_id: str) -> bool:
    """Delete an enquiry."""
    enquiry = db.query(CustomerEnquiry).filter(CustomerEnquiry.id == enquiry_id).first()
    if not enquiry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Enquiry not found")

    db.delete(enquiry)
    db.commit()
    return True


def get_enquiry_metrics(db: Session) -> Dict[str, int]:
    """Get counts by status for badges and dashboard statistics."""
    new_count = db.query(CustomerEnquiry).filter(CustomerEnquiry.status == "NEW").count()
    contacted_count = db.query(CustomerEnquiry).filter(CustomerEnquiry.status == "CONTACTED").count()
    completed_count = db.query(CustomerEnquiry).filter(CustomerEnquiry.status == "COMPLETED").count()
    total_count = db.query(CustomerEnquiry).count()

    return {
        "new": new_count,
        "contacted": contacted_count,
        "completed": completed_count,
        "total": total_count,
    }

