from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    products,
    vehicles,
    public_enquiries,
    settings,
    admin_products,
    admin_inventory,
    admin_sales,
    admin_enquiries,
    admin_users,
    admin_settings,
    admin_dashboard,
    upload,
)

api_router = APIRouter()

# Public routes
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(products.router, tags=["Products & Catalog"])
api_router.include_router(vehicles.router, tags=["Vehicles & Compatibility"])
api_router.include_router(public_enquiries.router, tags=["Customer Enquiries"])
api_router.include_router(settings.router, tags=["Settings"])

# Admin routes
api_router.include_router(admin_dashboard.router, prefix="/admin", tags=["Admin Dashboard"])
api_router.include_router(admin_products.router, prefix="/admin", tags=["Admin Products"])
api_router.include_router(admin_inventory.router, prefix="/admin", tags=["Admin Inventory"])
api_router.include_router(admin_sales.router, prefix="/admin", tags=["Admin Sales"])
api_router.include_router(admin_enquiries.router, prefix="/admin", tags=["Admin Enquiries"])
api_router.include_router(admin_users.router, prefix="/admin", tags=["Admin User Management"])
api_router.include_router(admin_settings.router, prefix="/admin", tags=["Admin Settings"])
api_router.include_router(upload.router, prefix="/admin", tags=["Upload"])

