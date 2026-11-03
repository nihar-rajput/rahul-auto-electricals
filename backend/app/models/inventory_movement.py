import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base


def utcnow():
    return datetime.now(timezone.utc)


class InventoryMovement(Base):
    __tablename__ = "inventory_movements"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    product_id = Column(String(36), ForeignKey("products.id"), nullable=False)
    admin_id = Column(String(36), ForeignKey("admin_users.id"), nullable=True)
    movement_type = Column(String(30), nullable=False)  # RESTOCK, SALE, MANUAL_REMOVAL, CORRECTION, SALE_CANCELLATION
    quantity_change = Column(Integer, nullable=False)
    previous_quantity = Column(Integer, nullable=False)
    new_quantity = Column(Integer, nullable=False)
    reason = Column(String(500), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    product = relationship("Product", back_populates="movements")
    admin = relationship("AdminUser")

