from app.schemas.common import MessageResponse, PaginatedResponse
from app.schemas.admin_user import AdminUserCreate, AdminUserUpdate, AdminUserResponse
from app.schemas.auth import LoginRequest, TokenResponse, RefreshTokenRequest, ForgotPasswordRequest, ResetPasswordRequest
from app.schemas.brand import BrandCreate, BrandUpdate, BrandResponse
from app.schemas.category import ProductCategoryCreate, ProductCategoryUpdate, ProductCategoryResponse
from app.schemas.vehicle import VehicleCreate, VehicleUpdate, VehicleResponse
from app.schemas.product import (
    ProductCreate,
    ProductUpdate,
    ProductAdminResponse,
    ProductPublicResponse,
    ProductImageCreate,
    ProductImageResponse,
    ProductVehicleCompatibilityCreate,
    ProductVehicleCompatibilityResponse,
)
from app.schemas.inventory import InventoryAdjustRequest, InventoryMovementResponse
from app.schemas.sale import SaleCreate, SaleResponse, SaleItemCreate, SaleItemResponse
from app.schemas.enquiry import CustomerEnquiryCreate, CustomerEnquiryUpdate, CustomerEnquiryResponse
from app.schemas.settings import WebsiteSettingsPublicResponse, WebsiteSettingsAdminResponse, WebsiteSettingsUpdate

__all__ = [
    "MessageResponse",
    "PaginatedResponse",
    "AdminUserCreate",
    "AdminUserUpdate",
    "AdminUserResponse",
    "LoginRequest",
    "TokenResponse",
    "RefreshTokenRequest",
    "ForgotPasswordRequest",
    "ResetPasswordRequest",
    "BrandCreate",
    "BrandUpdate",
    "BrandResponse",
    "ProductCategoryCreate",
    "ProductCategoryUpdate",
    "ProductCategoryResponse",
    "VehicleCreate",
    "VehicleUpdate",
    "VehicleResponse",
    "ProductCreate",
    "ProductUpdate",
    "ProductAdminResponse",
    "ProductPublicResponse",
    "ProductImageCreate",
    "ProductImageResponse",
    "ProductVehicleCompatibilityCreate",
    "ProductVehicleCompatibilityResponse",
    "InventoryAdjustRequest",
    "InventoryMovementResponse",
    "SaleCreate",
    "SaleResponse",
    "SaleItemCreate",
    "SaleItemResponse",
    "CustomerEnquiryCreate",
    "CustomerEnquiryUpdate",
    "CustomerEnquiryResponse",
    "WebsiteSettingsPublicResponse",
    "WebsiteSettingsAdminResponse",
    "WebsiteSettingsUpdate",
]
