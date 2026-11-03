from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime
from app.db.base import Base


def utcnow():
    return datetime.now(timezone.utc)


class WebsiteSettings(Base):
    __tablename__ = "website_settings"

    id = Column(String(36), primary_key=True, default="default_settings")
    business_name = Column(String(200), default="Rahul Auto Electricals", nullable=False)
    business_phone = Column(String(50), default="+91 98765 43210", nullable=False)
    whatsapp_number = Column(String(50), default="+919876543210", nullable=False)
    business_address = Column(String(500), default="Shop No. 4, Main Road, Auto Market, Near City Circle", nullable=False)
    opening_hours = Column(String(255), default="Mon - Sat: 9:00 AM - 8:30 PM, Sun: 10:00 AM - 2:00 PM", nullable=False)
    maps_url = Column(String(1000), default="https://maps.google.com", nullable=False)
    default_stock_visibility_mode = Column(String(30), default="SIMPLE_STATUS", nullable=False)  # EXACT_QUANTITY, SIMPLE_STATUS, STOCK_LEVEL
    default_low_stock_threshold = Column(Integer, default=5, nullable=False)
    default_language = Column(String(10), default="en", nullable=False)  # en, hi
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

