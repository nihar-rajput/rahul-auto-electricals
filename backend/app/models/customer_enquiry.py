import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime
from app.db.base import Base


def utcnow():
    return datetime.now(timezone.utc)


class CustomerEnquiry(Base):
    __tablename__ = "customer_enquiries"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    customer_name = Column(String(150), nullable=False)
    phone = Column(String(50), nullable=False)
    vehicle_brand = Column(String(100), nullable=True)
    vehicle_model = Column(String(100), nullable=True)
    vehicle_year = Column(String(20), nullable=True)
    battery_type = Column(String(50), nullable=True)
    preferred_brand = Column(String(100), nullable=True)
    message = Column(Text, nullable=True)
    status = Column(String(30), default="NEW", nullable=False)  # NEW, CONTACTED, COMPLETED, CANCELLED
    admin_notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

