import argparse
import sys
from decimal import Decimal
from sqlalchemy.orm import Session

from app.db.session import SessionLocal, engine
from app.db.base import Base
from app.models.admin_user import AdminUser
from app.models.brand import Brand
from app.models.product_category import ProductCategory
from app.models.vehicle import Vehicle
from app.models.product import Product
from app.models.product_image import ProductImage
from app.models.product_vehicle_compatibility import ProductVehicleCompatibility
from app.models.inventory_movement import InventoryMovement
from app.models.website_settings import WebsiteSettings
from app.core.security import get_password_hash
from app.core.config import settings
from app.services.product_service import generate_slug


def create_superadmin(email: str, password: str, name: str):
    """Securely creates the initial Super Admin account."""
    db: Session = SessionLocal()
    try:
        existing = db.query(AdminUser).filter(AdminUser.email == email.lower().strip()).first()
        if existing:
            print(f"[!] User with email '{email}' already exists. Updating role to SUPER_ADMIN.")
            existing.role = "SUPER_ADMIN"
            existing.password_hash = get_password_hash(password)
            existing.is_active = True
            db.commit()
            print(f"[OK] Super Admin '{email}' updated successfully.")
            return

        user = AdminUser(
            name=name,
            email=email.lower().strip(),
            password_hash=get_password_hash(password),
            role="SUPER_ADMIN",
            is_active=True,
        )
        db.add(user)
        db.commit()
        print(f"[OK] Super Admin account created successfully for '{email}'.")
    finally:
        db.close()


def seed_database():
    """Seed sample catalog data including PowerZone batteries, categories, and vehicle compatibilities."""
    db: Session = SessionLocal()
    try:
        # 1. Default Settings
        settings_record = db.query(WebsiteSettings).filter(WebsiteSettings.id == "default_settings").first()
        if not settings_record:
            settings_record = WebsiteSettings(
                id="default_settings",
                business_name="Rahul Auto Electricals",
                business_phone="+91 98765 43210",
                whatsapp_number="+919876543210",
                business_address="Shop No. 4, Main Road, Auto Market, Near City Circle",
                opening_hours="Mon - Sat: 9:00 AM - 8:30 PM, Sun: 10:00 AM - 2:00 PM",
                maps_url="https://maps.google.com/?q=Rahul+Auto+Electricals",
                default_stock_visibility_mode="SIMPLE_STATUS",
                default_low_stock_threshold=5,
                default_language="en",
            )
            db.add(settings_record)

        # 2. Brands
        powerzone = db.query(Brand).filter(Brand.slug == "powerzone").first()
        if not powerzone:
            powerzone = Brand(
                name="PowerZone",
                slug="powerzone",
                is_active=True,
                description="PowerZone Automotive Batteries by Amara Raja Batteries Ltd.",
            )
            db.add(powerzone)

        exide = db.query(Brand).filter(Brand.slug == "exide").first()
        if not exide:
            exide = Brand(
                name="Exide",
                slug="exide",
                is_active=True,
                description="Exide Industries Limited Automotive Batteries",
            )
            db.add(exide)

        amaron = db.query(Brand).filter(Brand.slug == "amaron").first()
        if not amaron:
            amaron = Brand(
                name="Amaron",
                slug="amaron",
                is_active=True,
                description="Amaron Hi-Life Long-lasting Automotive Batteries",
            )
            db.add(amaron)

        db.flush()

        # 3. Categories
        cat_batteries = db.query(ProductCategory).filter(ProductCategory.slug == "batteries").first()
        if not cat_batteries:
            cat_batteries = ProductCategory(
                name="Batteries",
                slug="batteries",
                description="Automotive, inverter, and commercial storage batteries",
            )
            db.add(cat_batteries)

        cat_autoparts = db.query(ProductCategory).filter(ProductCategory.slug == "auto-spare-parts").first()
        if not cat_autoparts:
            cat_autoparts = ProductCategory(
                name="Auto Spare Parts",
                slug="auto-spare-parts",
                description="Automobile electrical components and spare parts (Future module)",
            )
            db.add(cat_autoparts)

        db.flush()

        # 4. Vehicles
        sample_vehicles = [
            ("Maruti Suzuki", "Swift", 2018, "Petrol/Diesel"),
            ("Maruti Suzuki", "Baleno", 2019, "Petrol"),
            ("Maruti Suzuki", "Dzire", 2017, "Petrol/Diesel"),
            ("Hyundai", "i20", 2020, "Petrol/Diesel"),
            ("Hyundai", "Creta", 2021, "Petrol/Diesel"),
            ("Tata", "Nexon", 2022, "Petrol/Diesel/EV"),
            ("Tata", "Punch", 2022, "Petrol"),
            ("Honda", "City", 2019, "Petrol"),
            ("Honda", "Activa 6G", 2021, "Petrol"),
            ("Hero", "Splendor Plus", 2020, "Petrol"),
            ("Royal Enfield", "Classic 350", 2021, "Petrol"),
            ("Tata", "Ace (Chota Hathi)", 2019, "Diesel/CNG"),
            ("Ashok Leyland", "Dost", 2020, "Diesel"),
        ]

        vehicle_map = {}
        for mfg, mdl, yr, fuel in sample_vehicles:
            key = f"{mfg}_{mdl}"
            v = db.query(Vehicle).filter(Vehicle.manufacturer == mfg, Vehicle.model == mdl).first()
            if not v:
                v = Vehicle(manufacturer=mfg, model=mdl, year=yr, fuel_type=fuel)
                db.add(v)
                db.flush()
            vehicle_map[key] = v

        # 5. Products
        battery_data = [
            {
                "name": "PowerZone PZ-38B20R Car Battery",
                "slug": "powerzone-pz-38b20r-car-battery",
                "model": "PZ-38B20R",
                "part_number": "PZ38B20R-IND",
                "battery_type": "Car",
                "price": Decimal("4199.00"),
                "quantity": 18,
                "voltage": "12V",
                "ah_capacity": "35Ah",
                "warranty_duration": "48 Months (24 Free + 24 Pro-rata)",
                "guarantee_details": "24 Months Replacement Guarantee",
                "description": "High performance maintenance-free car battery with patented silver alloy technology. Delivers superior cranking power and high heat tolerance.",
                "brand": powerzone,
                "compatible_keys": ["Maruti Suzuki_Swift", "Maruti Suzuki_Dzire", "Maruti Suzuki_Baleno"],
                "image": "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=800&q=80",
            },
            {
                "name": "PowerZone PZ-44B20L Car Battery",
                "slug": "powerzone-pz-44b20l-car-battery",
                "model": "PZ-44B20L",
                "part_number": "PZ44B20L-IND",
                "battery_type": "Car",
                "price": Decimal("4699.00"),
                "quantity": 14,
                "voltage": "12V",
                "ah_capacity": "40Ah",
                "warranty_duration": "48 Months (24 Free + 24 Pro-rata)",
                "guarantee_details": "24 Months Free Replacement",
                "description": "Specially designed for modern compact and hatchback cars. Provides ultra-low water loss and high vibration resistance for Indian roads.",
                "brand": powerzone,
                "compatible_keys": ["Hyundai_i20", "Tata_Punch", "Honda_City"],
                "image": "https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?auto=format&fit=crop&w=800&q=80",
            },
            {
                "name": "PowerZone PZ-DIN55 Heavy Car Battery",
                "slug": "powerzone-pz-din55-car-battery",
                "model": "PZ-DIN55",
                "part_number": "PZDIN55-IND",
                "battery_type": "Car",
                "price": Decimal("6499.00"),
                "quantity": 8,
                "voltage": "12V",
                "ah_capacity": "55Ah",
                "warranty_duration": "60 Months (36 Free + 24 Pro-rata)",
                "guarantee_details": "36 Months Replacement Guarantee",
                "description": "European DIN standard car battery engineered for compact SUVs, sedans, and high electrical load diesel vehicles.",
                "brand": powerzone,
                "compatible_keys": ["Hyundai_Creta", "Tata_Nexon"],
                "image": "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=800&q=80",
            },
            {
                "name": "PowerZone PZ-5L-B Two-Wheeler Battery",
                "slug": "powerzone-pz-5l-b-bike-battery",
                "model": "PZ-5L-B",
                "part_number": "PZ5LB-MC",
                "battery_type": "Bike",
                "price": Decimal("1399.00"),
                "quantity": 25,
                "voltage": "12V",
                "ah_capacity": "5Ah",
                "warranty_duration": "36 Months (18 Free + 18 Pro-rata)",
                "guarantee_details": "18 Months Replacement Guarantee",
                "description": "VRLA (Valve Regulated Lead Acid) maintenance-free motorcycle battery. Sealed design prevents acid leakage on bumpy rides.",
                "brand": powerzone,
                "compatible_keys": ["Honda_Activa 6G", "Hero_Splendor Plus", "Royal Enfield_Classic 350"],
                "image": "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=800&q=80",
            },
            {
                "name": "PowerZone PZ-150TT Tall Tubular Inverter Battery",
                "slug": "powerzone-pz-150tt-inverter-battery",
                "model": "PZ-150TT",
                "part_number": "PZ150TT-INV",
                "battery_type": "Inverter",
                "price": Decimal("14299.00"),
                "quantity": 6,
                "voltage": "12V",
                "ah_capacity": "150Ah",
                "warranty_duration": "60 Months (36 Free + 24 Pro-rata)",
                "guarantee_details": "36 Months Free Replacement",
                "description": "Heavy-duty Tall Tubular inverter battery capable of deep discharge cycles. Ideal for home backup and small business power continuity.",
                "brand": powerzone,
                "compatible_keys": [],
                "image": "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=800&q=80",
            },
            {
                "name": "PowerZone PZ-COMM80 Commercial Vehicle Battery",
                "slug": "powerzone-pz-comm80-commercial-battery",
                "model": "PZ-COMM80",
                "part_number": "PZCOMM80-CV",
                "battery_type": "Commercial",
                "price": Decimal("8899.00"),
                "quantity": 4,
                "voltage": "12V",
                "ah_capacity": "80Ah",
                "warranty_duration": "36 Months (24 Free + 12 Pro-rata)",
                "guarantee_details": "24 Months Free Replacement",
                "description": "Reinforced commercial vehicle battery designed for light commercial vehicles, mini trucks, and fleet transport vehicles.",
                "brand": powerzone,
                "compatible_keys": ["Tata_Ace (Chota Hathi)", "Ashok Leyland_Dost"],
                "image": "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
            },
            {
                "name": "Exide Mileage MLDD35R Car Battery",
                "slug": "exide-mileage-mldd35r-car-battery",
                "model": "MLDD35R",
                "part_number": "EX-ML35R",
                "battery_type": "Car",
                "price": Decimal("4450.00"),
                "quantity": 10,
                "voltage": "12V",
                "ah_capacity": "35Ah",
                "warranty_duration": "48 Months (24 Free + 24 Pro-rata)",
                "guarantee_details": "24 Months Replacement",
                "description": "Special alloy combination for extreme temperature conditions and robust design for long life.",
                "brand": exide,
                "compatible_keys": ["Maruti Suzuki_Swift", "Maruti Suzuki_Dzire"],
                "image": "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=800&q=80",
            },
            {
                "name": "Amaron FLO AAM-FL-542106044 Car Battery",
                "slug": "amaron-flo-car-battery",
                "model": "AAM-FL-542106044",
                "part_number": "AMR-FLO42",
                "battery_type": "Car",
                "price": Decimal("5200.00"),
                "quantity": 2,  # Low stock test
                "voltage": "12V",
                "ah_capacity": "42Ah",
                "warranty_duration": "55 Months (30 Free + 25 Pro-rata)",
                "guarantee_details": "30 Months Replacement",
                "description": "Longest life car battery with zero maintenance and high heat tolerance.",
                "brand": amaron,
                "compatible_keys": ["Hyundai_i20", "Honda_City"],
                "image": "https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?auto=format&fit=crop&w=800&q=80",
            },
        ]

        for b_item in battery_data:
            existing = db.query(Product).filter(Product.slug == b_item["slug"]).first()
            if not existing:
                p = Product(
                    name=b_item["name"],
                    slug=b_item["slug"],
                    brand_id=b_item["brand"].id,
                    category_id=cat_batteries.id,
                    model=b_item["model"],
                    part_number=b_item["part_number"],
                    battery_type=b_item["battery_type"],
                    price=b_item["price"],
                    quantity=b_item["quantity"],
                    voltage=b_item["voltage"],
                    ah_capacity=b_item["ah_capacity"],
                    warranty_duration=b_item["warranty_duration"],
                    guarantee_details=b_item["guarantee_details"],
                    description=b_item["description"],
                    low_stock_threshold=5,
                    is_published=True,
                )
                db.add(p)
                db.flush()

                # Add image
                img = ProductImage(
                    product_id=p.id,
                    image_url=b_item["image"],
                    is_primary=True,
                    display_order=0,
                )
                db.add(img)

                # Add initial stock movement
                if p.quantity > 0:
                    mov = InventoryMovement(
                        product_id=p.id,
                        admin_id=None,
                        movement_type="RESTOCK",
                        quantity_change=p.quantity,
                        previous_quantity=0,
                        new_quantity=p.quantity,
                        reason="Initial seed catalog stock",
                    )
                    db.add(mov)

                # Add vehicle compatibilities
                for key in b_item["compatible_keys"]:
                    veh = vehicle_map.get(key)
                    if veh:
                        comp = ProductVehicleCompatibility(
                            product_id=p.id,
                            vehicle_id=veh.id,
                            compatible_from_year=2015,
                            compatible_to_year=2024,
                            notes=f"Direct OEM fitment for {veh.manufacturer} {veh.model}",
                        )
                        db.add(comp)

        db.commit()
        print("[OK] Seed data inserted successfully.")
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(description="Rahul Auto Electricals Management CLI")
    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # Command: create-superadmin
    superadmin_parser = subparsers.add_parser("create-superadmin", help="Create the initial Super Admin account")
    superadmin_parser.add_argument("--email", default=settings.INITIAL_SUPERADMIN_EMAIL, help="Super admin email")
    superadmin_parser.add_argument("--password", default=settings.INITIAL_SUPERADMIN_PASSWORD, help="Super admin password")
    superadmin_parser.add_argument("--name", default=settings.INITIAL_SUPERADMIN_NAME, help="Super admin full name")

    # Command: seed-data
    subparsers.add_parser("seed-data", help="Seed default battery products, brands, and vehicle compatibility")

    args = parser.parse_args()

    if args.command == "create-superadmin":
        create_superadmin(args.email, args.password, args.name)
    elif args.command == "seed-data":
        seed_database()
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
