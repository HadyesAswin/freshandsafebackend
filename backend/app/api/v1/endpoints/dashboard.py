from fastapi import APIRouter, Depends, Query
from sqlalchemy import extract, func, or_ # ✅ Added or_ import
from sqlalchemy.orm import Session
from app.core.database import get_db
# ✅ Added PaymentStatus import
from app.models import User, UserRole, Order, Product, OrderStatus, PaymentStatus 
from typing import Optional
from datetime import date
import math

router = APIRouter()

# ==========================================
# 1. DASHBOARD OVERVIEW STATS
# ==========================================
@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    
    # ✅ BUGFIX: Define the valid orders condition (Paid online OR COD)
    valid_order_condition = or_(
        func.lower(Order.payment_method) == "cod",
        Order.payment_status == PaymentStatus.PAID,
        Order.order_status != OrderStatus.PENDING
    )

    # Total Revenue (Only from valid orders)
    total_revenue = db.query(func.sum(Order.total_amount)).filter(valid_order_condition).scalar() or 0
    
    # Total Orders (Only valid orders)
    total_orders = db.query(Order).filter(valid_order_condition).count()
    
    # Pending Orders (Action Required - meaning valid orders that the shop needs to process)
    # Usually, a shop only needs to act on CONFIRMED orders. 
    # If PENDING means "customer hasn't paid", the shop can't take action.
    pending_orders = db.query(Order).filter(
        Order.order_status == OrderStatus.CONFIRMED # Changed from PENDING to CONFIRMED
    ).count()
    
    # Total Customers (Excluding Admins)
    total_customers = db.query(User).filter(User.role == UserRole.CUSTOMER).count()

    # Inventory count
    total_products = db.query(Product).count()

    return {
        "total_revenue": round(total_revenue, 2),
        "total_orders": total_orders,
        "pending_orders": pending_orders,
        "total_customers": total_customers,
        "total_products": total_products
    }

# ==========================================
# 2. USER MANAGEMENT (With Pagination & Filters)
# ==========================================
@router.get("/users")
def get_admin_users(
    db: Session = Depends(get_db),
    role: Optional[str] = None,
    year: Optional[int] = Query(None, ge=2024),
    month: Optional[int] = Query(None, ge=1, le=12),
    specific_date: Optional[date] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100)
):
    # Base query excluding Admins for security/clarity
    query = db.query(User).filter(User.role != UserRole.ADMIN)

    # Apply Filters
    if role:
        query = query.filter(User.role == role)
    
    if specific_date:
        query = query.filter(func.date(User.created_at) == specific_date)
    else:
        if year:
            query = query.filter(extract('year', User.created_at) == year)
        if month:
            query = query.filter(extract('month', User.created_at) == month)

    # Calculate Pagination
    total_users = query.count()
    total_pages = math.ceil(total_users / page_size)
    offset = (page - 1) * page_size
    
    users = query.order_by(User.created_at.desc()).offset(offset).limit(page_size).all()

    return {
        "users": [
            {
                "id": u.id,
                "full_name": u.full_name,
                "email": u.email,
                "phone": u.phone,
                "role": u.role,
                "is_active": u.is_active,
                "created_at": u.created_at.strftime("%Y-%m-%d %H:%M"),
            } for u in users
        ],
        "pagination": {
            "total_count": total_users,
            "total_pages": total_pages,
            "current_page": page,
            "page_size": page_size
        }
    }