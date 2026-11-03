import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Numeric, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base


def utcnow():
    return datetime.now(timezone.utc)


class Sale(Base):
    __tablename__ = "sales"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    admin_id = Column(String(36), ForeignKey("admin_users.id"), nullable=True)
    sale_date = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    total_amount = Column(Numeric(10, 2), nullable=False)
    customer_name = Column(String(150), nullable=True)
    customer_phone = Column(String(50), nullable=True)
    notes = Column(Text, nullable=True)
    status = Column(String(30), default="COMPLETED", nullable=False)  # COMPLETED, CANCELLED
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    admin = relationship("AdminUser")
    items = relationship("SaleItem", back_populates="sale", cascade="all, delete-orphan")

