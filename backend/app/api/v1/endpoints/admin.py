from fastapi import APIRouter, Depends, Query
from sqlalchemy import extract, func
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import User, UserRole
from typing import Optional
from datetime import date
import math

router = APIRouter()

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
    # Base query excluding Admins
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

    # 1. Get Total Count for Pagination metadata
    total_users = query.count()

    # 2. Apply Pagination (Offset and Limit)
    offset = (page - 1) * page_size
    users = query.order_by(User.created_at.desc()).offset(offset).limit(page_size).all()

    # 3. Calculate total pages
    total_pages = math.ceil(total_users / page_size)

    return {
        "users": [
            {
                "id": u.id,
                "full_name": u.full_name,
                "email": u.email,
                "phone": u.phone,
                "role": u.role,
                "is_active": u.is_active,
                "sms_subscription": u.sms_subscription,
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