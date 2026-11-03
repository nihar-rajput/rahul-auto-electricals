import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime
from sqlalchemy.orm import relationship
from app.db.base import Base


def utcnow():
    return datetime.now(timezone.utc)


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    manufacturer = Column(String(100), index=True, nullable=False)  # e.g., Maruti Suzuki, Hyundai, Honda
    model = Column(String(100), index=True, nullable=False)         # e.g., Swift, Creta, City, Activa
    year = Column(Integer, nullable=True)                          # Reference base year
    fuel_type = Column(String(50), nullable=True)                  # Petrol, Diesel, CNG, Electric
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    compatibilities = relationship("ProductVehicleCompatibility", back_populates="vehicle", cascade="all, delete-orphan")

