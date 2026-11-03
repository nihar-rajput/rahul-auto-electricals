import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Numeric, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base


def utcnow():
    return datetime.now(timezone.utc)


class Product(Base):
    __tablename__ = "products"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(200), index=True, nullable=False)
    slug = Column(String(250), unique=True, index=True, nullable=False)
    brand_id = Column(String(36), ForeignKey("brands.id"), nullable=False)
    category_id = Column(String(36), ForeignKey("product_categories.id"), nullable=False)
    model = Column(String(100), index=True, nullable=False)
    part_number = Column(String(100), index=True, nullable=True)
    battery_type = Column(String(50), index=True, nullable=False)  # Car, Bike, Truck, Inverter, Commercial, Other
    description = Column(Text, nullable=True)
    price = Column(Numeric(10, 2), nullable=False)
    quantity = Column(Integer, default=0, nullable=False)
    voltage = Column(String(50), nullable=True)                     # e.g., "12V"
    ah_capacity = Column(String(50), nullable=True)                 # e.g., "35Ah"
    warranty_duration = Column(String(100), nullable=True)          # e.g., "48 Months (24 Free + 24 Pro-rata)"
    guarantee_details = Column(String(255), nullable=True)          # e.g., "Full replacement guarantee for 24 months"
    low_stock_threshold = Column(Integer, default=5, nullable=False)
    stock_visibility_mode = Column(String(30), nullable=True)       # EXACT_QUANTITY, SIMPLE_STATUS, STOCK_LEVEL, or NULL (inherits default)
    is_published = Column(Boolean, default=True, index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)     # Soft-deletion support

    # Relationships
    brand = relationship("Brand", back_populates="products")
    category = relationship("ProductCategory", back_populates="products")
    images = relationship("ProductImage", back_populates="product", cascade="all, delete-orphan", order_by="ProductImage.display_order")
    compatibilities = relationship("ProductVehicleCompatibility", back_populates="product", cascade="all, delete-orphan")
    movements = relationship("InventoryMovement", back_populates="product")

