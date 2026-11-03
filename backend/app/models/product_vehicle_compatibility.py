import uuid
from sqlalchemy import Column, String, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base


class ProductVehicleCompatibility(Base):
    __tablename__ = "product_vehicle_compatibilities"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    product_id = Column(String(36), ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    vehicle_id = Column(String(36), ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False)
    compatible_from_year = Column(Integer, nullable=True)
    compatible_to_year = Column(Integer, nullable=True)
    notes = Column(String(255), nullable=True)

    product = relationship("Product", back_populates="compatibilities")
    vehicle = relationship("Vehicle", back_populates="compatibilities")

