from fastapi import APIRouter, Depends, Query
from sqlalchemy import extract, func, desc, or_ # ✅ Added or_
from sqlalchemy.orm import Session
from app.core.database import get_db
# ✅ Added OrderStatus and PaymentStatus
from app.models import Order, Outlet, OrderStatus, PaymentStatus
from typing import Optional, List
from datetime import date
from fastapi.responses import StreamingResponse
from io import StringIO
import csv

router = APIRouter()

@router.get("/overview")
def get_sales_overview(
    db: Session = Depends(get_db),
    outlet_id: Optional[int] = None,
    year: Optional[int] = Query(2026),
    month: Optional[int] = None,
    specific_date: Optional[date] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1)
):
    # 1. Base Query for Orders
    # ✅ BUGFIX: Only pull orders that are actually valid (Paid online or COD)
    valid_order_condition = or_(
        func.lower(Order.payment_method) == "cod",
        Order.payment_status == PaymentStatus.PAID,
        Order.order_status != OrderStatus.PENDING
    )
    
    query = db.query(Order).filter(valid_order_condition)

    # 2. Apply Filters (Shop, Date, Month, Year)
    if outlet_id:
        query = query.filter(Order.outlet_id == outlet_id)
    
    if specific_date:
        query = query.filter(func.date(Order.created_at) == specific_date)
    else:
        if year:
            query = query.filter(extract('year', Order.created_at) == year)
        if month:
            query = query.filter(extract('month', Order.created_at) == month)

    # 3. Calculate Totals (Summary Stats)
    # We use a subquery or a separate filtered query to get sums/counts accurately
    summary_stats = db.query(
        func.count(Order.id).label("total_count"),
        func.sum(Order.total_amount).label("total_revenue")
    ).filter(Order.id.in_(query.with_entities(Order.id))).first()

    # 4. Pagination Logic
    total_records = query.count()
    offset = (page - 1) * page_size
    orders = query.order_by(desc(Order.created_at)).offset(offset).limit(page_size).all()

    # 5. Build Response
    return {
        "summary": {
            "total_orders": summary_stats.total_count or 0,
            "total_revenue": round(summary_stats.total_revenue or 0, 2)
        },
        "orders": [
            {
                "order_number": o.order_number,
                "customer": o.customer_name,
                "amount": o.total_amount,
                "status": o.order_status,
                "date": o.created_at.strftime("%Y-%m-%d %H:%M"),
                "outlet_name": o.outlet.outlet_name if o.outlet else "N/A"
            } for o in orders
        ],
        "pagination": {
            "total": total_records,
            "page": page,
            "page_size": page_size,
            "last_page": (total_records // page_size) + (1 if total_records % page_size > 0 else 0)
        }
    }


@router.get("/export")
def export_sales(
    db: Session = Depends(get_db),
    outlet_id: Optional[int] = None,
    year: Optional[int] = Query(2026),
    month: Optional[int] = None,
    specific_date: Optional[date] = None,
):
    # ✅ SAME VALID ORDER CONDITION (copy from overview)
    valid_order_condition = or_(
        func.lower(Order.payment_method) == "cod",
        Order.payment_status == PaymentStatus.PAID,
        Order.order_status != OrderStatus.PENDING
    )

    query = db.query(Order).filter(valid_order_condition)

    # ✅ SAME FILTERS (IMPORTANT)
    if outlet_id:
        query = query.filter(Order.outlet_id == outlet_id)

    if specific_date:
        query = query.filter(func.date(Order.created_at) == specific_date)
    else:
        if year:
            query = query.filter(extract('year', Order.created_at) == year)
        if month:
            query = query.filter(extract('month', Order.created_at) == month)

    # ✅ GET ALL (no pagination)
    orders = query.order_by(desc(Order.created_at)).all()

    # ✅ CREATE CSV
    output = StringIO()
    writer = csv.writer(output)

    # Header
    writer.writerow([
        "Order Number",
        "Customer",
        "Phone",
        "Amount",
        "Status",
        "Date",
        "Outlet",
        "Payment Method"
    ])

    # Data rows
    for o in orders:
        writer.writerow([
            o.order_number,
            o.customer_name,
            o.customer_phone,
            o.total_amount,
            o.order_status,
            o.created_at.strftime("%Y-%m-%d %H:%M"),
            o.outlet.outlet_name if o.outlet else "N/A",
            o.payment_method
        ])

    output.seek(0)

    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=sales_report.csv"
        }
    )    