from decimal import Decimal
from fastapi import status
from app.models.vehicle import Vehicle
from app.models.product_vehicle_compatibility import ProductVehicleCompatibility


def test_product_crud_and_public_visibility(client, superadmin_headers, test_brand, test_category):
    # 1. Admin creates product
    create_resp = client.post(
        "/api/v1/admin/products",
        headers=superadmin_headers,
        json={
            "name": "PowerZone PZ-TEST44 Battery",
            "brand_id": test_brand.id,
            "category_id": test_category.id,
            "model": "PZ-TEST44",
            "part_number": "PZTEST-01",
            "battery_type": "Car",
            "price": "4500.00",
            "quantity": 10,
            "voltage": "12V",
            "ah_capacity": "44Ah",
            "warranty_duration": "48 Months",
            "guarantee_details": "24 Months Free Replacement",
            "low_stock_threshold": 3,
            "stock_visibility_mode": "EXACT_QUANTITY",
            "is_published": True,
            "description": "Premium automobile battery",
        },
    )
    assert create_resp.status_code == status.HTTP_201_CREATED
    prod_data = create_resp.json()
    prod_id = prod_data["id"]
    slug = prod_data["slug"]

    # 2. Public view respects EXACT_QUANTITY
    pub_resp = client.get(f"/api/v1/products/{slug}")
    assert pub_resp.status_code == status.HTTP_200_OK
    pub_data = pub_resp.json()
    assert pub_data["is_in_stock"] is True
    assert pub_data["display_quantity"] == 10
    assert "10 units available" in pub_data["stock_status_text"]

    # 3. Admin updates to SIMPLE_STATUS
    update_resp = client.put(
        f"/api/v1/admin/products/{prod_id}",
        headers=superadmin_headers,
        json={
            "stock_visibility_mode": "SIMPLE_STATUS",
        },
    )
    assert update_resp.status_code == status.HTTP_200_OK

    # Public view now hides exact quantity
    pub_resp2 = client.get(f"/api/v1/products/{slug}")
    pub_data2 = pub_resp2.json()
    assert pub_data2["is_in_stock"] is True
    assert pub_data2["display_quantity"] is None
    assert pub_data2["stock_status_text"] == "In Stock"

    # 4. Soft delete product
    del_resp = client.delete(f"/api/v1/admin/products/{prod_id}", headers=superadmin_headers)
    assert del_resp.status_code == status.HTTP_200_OK

    # Public view cannot find soft-deleted product
    pub_resp3 = client.get(f"/api/v1/products/{slug}")
    assert pub_resp3.status_code == status.HTTP_404_NOT_FOUND


def test_vehicle_compatibility_search(client, db, superadmin_headers, test_brand, test_category):
    # Create vehicle
    vehicle = Vehicle(manufacturer="Maruti Suzuki", model="Swift", year=2020, fuel_type="Petrol")
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)

    # Create battery with compatibility
    create_resp = client.post(
        "/api/v1/admin/products",
        headers=superadmin_headers,
        json={
            "name": "PowerZone Swift Fit Battery",
            "brand_id": test_brand.id,
            "category_id": test_category.id,
            "model": "PZ-SWIFT-01",
            "battery_type": "Car",
            "price": "3999.00",
            "quantity": 5,
            "is_published": True,
            "compatibilities": [
                {
                    "vehicle_id": vehicle.id,
                    "compatible_from_year": 2018,
                    "compatible_to_year": 2024,
                    "notes": "Direct OEM fitment",
                }
            ],
        },
    )
    assert create_resp.status_code == status.HTTP_201_CREATED

    # Query vehicle compatible batteries endpoint
    compat_resp = client.get(
        "/api/v1/vehicles/compatible-batteries",
        params={"manufacturer": "Maruti Suzuki", "model": "Swift", "year": 2020},
    )
    assert compat_resp.status_code == status.HTTP_200_OK
    compat_data = compat_resp.json()
    assert len(compat_data) >= 1
    assert any(b["name"] == "PowerZone Swift Fit Battery" for b in compat_data)

    # General search query using vehicle name matches the battery
    search_resp = client.get("/api/v1/products", params={"search": "Swift"})
    assert search_resp.status_code == status.HTTP_200_OK
    assert search_resp.json()["total"] >= 1

