from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.enquiry import CustomerEnquiryCreate, CustomerEnquiryResponse
from app.schemas.common import MessageResponse
from app.services.enquiry_service import create_customer_enquiry

router = APIRouter()


@router.post("/enquiries", response_model=CustomerEnquiryResponse, status_code=status.HTTP_201_CREATED)
def submit_enquiry(enquiry_in: CustomerEnquiryCreate, db: Session = Depends(get_db)):
    """Submit a customer battery requirement enquiry."""
    return create_customer_enquiry(db, enquiry_in)


@router.post("/contact", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def submit_contact(enquiry_in: CustomerEnquiryCreate, db: Session = Depends(get_db)):
    """Submit a contact message from the contact page."""
    create_customer_enquiry(db, enquiry_in)
    return MessageResponse(
        message="Thank you for contacting Rahul Auto Electricals! We will respond promptly.",
        detail="Enquiry recorded successfully."
    )

