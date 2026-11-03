from decimal import Decimal
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.db.session import get_db
from app.core.permissions import get_current_active_admin
from app.models.admin_user import AdminUser
from app.models.product import Product
from app.models.sale import Sale
from app.models.customer_enquiry import CustomerEnquiry
from app.schemas.enquiry import CustomerEnquiryResponse

router = APIRouter()


@router.get("/dashboard/stats")
def get_dashboard_metrics(
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_active_admin),
):
    """
    Get aggregated statistics for the admin dashboard:
    Total products, available stock, low stock, out of stock,
    total sales revenue, and recent enquiries.
    """
    total_products = db.query(Product).filter(Product.deleted_at.is_(None)).count()
    total_stock_units = db.query(func.coalesce(func.sum(Product.quantity), 0)).filter(Product.deleted_at.is_(None)).scalar()
    
    out_of_stock_count = (
        db.query(Product)
        .filter(Product.deleted_at.is_(None), Product.quantity <= 0)
        .count()
    )
    low_stock_count = (
        db.query(Product)
        .filter(Product.deleted_at.is_(None), Product.quantity > 0, Product.quantity <= Product.low_stock_threshold)
        .count()
    )
    
    total_sales_count = db.query(Sale).filter(Sale.status == "COMPLETED").count()
    total_sales_revenue = db.query(func.coalesce(func.sum(Sale.total_amount), 0)).filter(Sale.status == "COMPLETED").scalar()

    new_enquiries_count = db.query(CustomerEnquiry).filter(CustomerEnquiry.status == "NEW").count()

    recent_enquiries = (
        db.query(CustomerEnquiry)
        .order_by(desc(CustomerEnquiry.created_at))
        .limit(5)
        .all()
    )

    return {
        "total_products": total_products,
        "total_stock_units": total_stock_units,
        "out_of_stock_count": out_of_stock_count,
        "low_stock_count": low_stock_count,
        "total_sales_count": total_sales_count,
        "total_sales_revenue": Decimal(str(total_sales_revenue)),
        "new_enquiries_count": new_enquiries_count,
        "recent_enquiries": [CustomerEnquiryResponse.model_validate(e) for e in recent_enquiries],
    }

