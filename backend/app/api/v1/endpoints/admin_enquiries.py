from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
import math

from app.db.session import get_db
from app.core.permissions import get_current_active_admin
from app.models.admin_user import AdminUser
from app.schemas.enquiry import (
    CustomerEnquiryUpdate,
    CustomerEnquiryResponse,
)
from app.schemas.common import MessageResponse, PaginatedResponse
from app.services.enquiry_service import (
    list_enquiries,
    get_enquiry_by_id,
    update_enquiry,
    delete_enquiry,
    get_enquiry_metrics,
)

router = APIRouter()


@router.get("/enquiries/stats")
def get_stats(
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_active_admin),
):
    """Get counts of enquiries by status for notification badges."""
    return get_enquiry_metrics(db)


@router.get("/enquiries", response_model=PaginatedResponse[CustomerEnquiryResponse])
def get_enquiries(
    status_filter: Optional[str] = Query(None, pattern="^(ALL|NEW|CONTACTED|COMPLETED|CANCELLED)$"),
    search: Optional[str] = None,
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_active_admin),
):
    """Retrieve customer enquiries with status filtering and search."""
    items, total = list_enquiries(
        db=db,
        status_filter=status_filter,
        search=search,
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


@router.get("/enquiries/{enquiry_id}", response_model=CustomerEnquiryResponse)
def get_enquiry(
    enquiry_id: str,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_active_admin),
):
    """Get single enquiry details."""
    enquiry = get_enquiry_by_id(db, enquiry_id)
    if not enquiry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Enquiry not found")
    return enquiry


@router.patch("/enquiries/{enquiry_id}", response_model=CustomerEnquiryResponse)
def patch_enquiry(
    enquiry_id: str,
    enquiry_in: CustomerEnquiryUpdate,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_active_admin),
):
    """Update enquiry status (NEW, CONTACTED, COMPLETED, CANCELLED) and internal notes."""
    return update_enquiry(db, enquiry_id, enquiry_in)


@router.delete("/enquiries/{enquiry_id}", response_model=MessageResponse)
def remove_enquiry(
    enquiry_id: str,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_active_admin),
):
    """Delete an enquiry."""
    delete_enquiry(db, enquiry_id)
    return MessageResponse(message="Enquiry deleted successfully")

