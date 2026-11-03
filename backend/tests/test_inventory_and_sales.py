from fastapi import status
from app.models.product import Product


def test_inventory_adjustment_and_negative_stock_prevention(client, superadmin_headers, test_brand, test_category):
    # 1. Create a product with initial stock 5
    create_resp = client.post(
        "/api/v1/admin/products",
        headers=superadmin_headers,
        json={
            "name": "PowerZone Stock Test Battery",
            "brand_id": test_brand.id,
            "category_id": test_category.id,
            "model": "PZ-STK-01",
            "battery_type": "Car",
            "price": "4000.00",
            "quantity": 5,
            "is_published": True,
        },
    )
    assert create_resp.status_code == status.HTTP_201_CREATED
    prod_id = create_resp.json()["id"]

    # 2. Restock +10
    restock_resp = client.post(
        "/api/v1/admin/inventory/adjust",
        headers=superadmin_headers,
        json={
            "product_id": prod_id,
            "movement_type": "RESTOCK",
            "quantity_change": 10,
            "reason": "Shipment arrival from distributor",
        },
    )
    assert restock_resp.status_code == status.HTTP_200_OK
    assert restock_resp.json()["previous_quantity"] == 5
    assert restock_resp.json()["new_quantity"] == 15

    # 3. Prevent reducing below 0
    fail_removal = client.post(
        "/api/v1/admin/inventory/adjust",
        headers=superadmin_headers,
        json={
            "product_id": prod_id,
            "movement_type": "MANUAL_REMOVAL",
            "quantity_change": 20,  # Only 15 available!
            "reason": "Excess removal test",
        },
    )
    assert fail_removal.status_code == status.HTTP_400_BAD_REQUEST
    assert "below zero" in fail_removal.json()["detail"].lower()

    # 4. Check movements log
    mov_resp = client.get(
        "/api/v1/admin/inventory/movements",
        headers=superadmin_headers,
        params={"product_id": prod_id},
    )
    assert mov_resp.status_code == status.HTTP_200_OK
    assert mov_resp.json()["total"] >= 2  # initial create + restock


def test_sale_recording_and_cancellation(client, superadmin_headers, test_brand, test_category):
    # 1. Create product with stock 8
    create_resp = client.post(
        "/api/v1/admin/products",
        headers=superadmin_headers,
        json={
            "name": "PowerZone Sale Test",
            "brand_id": test_brand.id,
            "category_id": test_category.id,
            "model": "PZ-SALE-01",
            "battery_type": "Bike",
            "price": "1500.00",
            "quantity": 8,
            "is_published": True,
        },
    )
    assert create_resp.status_code == status.HTTP_201_CREATED
    prod_id = create_resp.json()["id"]

    # 2. Record sale of 3 units
    sale_resp = client.post(
        "/api/v1/admin/sales",
        headers=superadmin_headers,
        json={
            "customer_name": "Ramesh Kumar",
            "customer_phone": "9876543210",
            "notes": "Walk-in purchase",
            "items": [
                {
                    "product_id": prod_id,
                    "quantity": 3,
                    "unit_price": "1500.00",
                }
            ],
        },
    )
    assert sale_resp.status_code == status.HTTP_201_CREATED
    sale_data = sale_resp.json()
    assert float(sale_data["total_amount"]) == 4500.00
    assert sale_data["status"] == "COMPLETED"
    sale_id = sale_data["id"]

    # Verify product stock reduced to 5
    prod_check = client.get(f"/api/v1/admin/products/{prod_id}", headers=superadmin_headers)
    assert prod_check.json()["quantity"] == 5

    # 3. Attempting to sell more than available fails
    fail_sale = client.post(
        "/api/v1/admin/sales",
        headers=superadmin_headers,
        json={
            "customer_name": "Greedy Buyer",
            "items": [
                {
                    "product_id": prod_id,
                    "quantity": 10,  # only 5 left
                    "unit_price": "1500.00",
                }
            ],
        },
    )
    assert fail_sale.status_code == status.HTTP_400_BAD_REQUEST
    assert "insufficient stock" in fail_sale.json()["detail"].lower()

    # 4. Cancel the sale and verify stock reversal
    cancel_resp = client.post(
        f"/api/v1/admin/sales/{sale_id}/cancel",
        headers=superadmin_headers,
        json={"reason": "Customer returned unopened item"},
    )
    assert cancel_resp.status_code == status.HTTP_200_OK
    assert cancel_resp.json()["status"] == "CANCELLED"

    # Verify product stock restored back to 8
    prod_check2 = client.get(f"/api/v1/admin/products/{prod_id}", headers=superadmin_headers)
    assert prod_check2.json()["quantity"] == 8


def test_customer_enquiry_flow(client, superadmin_headers):
    # Public customer submits enquiry
    enquiry_resp = client.post(
        "/api/v1/enquiries",
        json={
            "customer_name": "Amit Sharma",
            "phone": "9876501234",
            "vehicle_brand": "Tata",
            "vehicle_model": "Nexon",
            "vehicle_year": "2021",
            "battery_type": "Car",
            "preferred_brand": "PowerZone",
            "message": "Looking for a high performance replacement battery.",
        },
    )
    assert enquiry_resp.status_code == status.HTTP_201_CREATED
    enquiry_id = enquiry_resp.json()["id"]
    assert enquiry_resp.json()["status"] == "NEW"

    # Admin views enquiry
    admin_list = client.get("/api/v1/admin/enquiries", headers=superadmin_headers)
    assert admin_list.status_code == status.HTTP_200_OK
    assert admin_list.json()["total"] >= 1

    # Admin updates status to CONTACTED and adds notes
    patch_resp = client.patch(
        f"/api/v1/admin/enquiries/{enquiry_id}",
        headers=superadmin_headers,
        json={
            "status": "CONTACTED",
            "admin_notes": "Called customer at 2 PM, offered PowerZone PZ-DIN55.",
        },
    )
    assert patch_resp.status_code == status.HTTP_200_OK
    assert patch_resp.json()["status"] == "CONTACTED"
    assert "PZ-DIN55" in patch_resp.json()["admin_notes"]

