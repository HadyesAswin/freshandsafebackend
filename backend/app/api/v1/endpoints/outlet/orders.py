from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_ # ✅ Added or_ here
from typing import List
from datetime import datetime, date, timedelta
from sqlalchemy import extract
from typing import Optional

from app.core.database import get_db
from app.models import Order, OrderItem, Product, Outlet, OrderStatus, ShopProduct, PaymentStatus
# from app.schemas.order import OrderStatusUpdate, OrderResponse, SalesReportResponse
from app.schemas.order import (
    OrderStatusUpdate, 
    OrderResponse, 
    SalesReportResponse, # This covers the main response
    SalesReportItem      # ✅ Add this to fix the current error
)
from app.api.v1.endpoints.outlet.auth import get_current_outlet 

router = APIRouter()

# ==========================================
# OUTLET STATUS ON/OFF TOGGLE (MOVED TO TOP)
# ==========================================
class OutletStatusUpdate(BaseModel):
    status: bool

@router.get("/status")
def get_outlet_status(db: Session = Depends(get_db), current_outlet: Outlet = Depends(get_current_outlet)):
    """Get the current ON/OFF status of the outlet"""
    db.refresh(current_outlet) 
    return {"status": current_outlet.status}

@router.put("/status")
def update_outlet_status(req: OutletStatusUpdate, db: Session = Depends(get_db), current_outlet: Outlet = Depends(get_current_outlet)):
    """Turn the outlet ON or OFF"""
    current_outlet.status = req.status
    db.commit()
    
    status_text = "OPEN" if req.status else "CLOSED"
    return {
        "message": f"Store is now {status_text}", 
        "status": current_outlet.status
    }

# --- 1. GET DASHBOARD STATS ---
@router.get("/stats/summary")
def get_outlet_stats(db: Session = Depends(get_db), current_outlet: Outlet = Depends(get_current_outlet)):
    """
    Fetches quick stats for the outlet dashboard.
    """
    new_orders_count = db.query(Order).filter(
        Order.outlet_id == current_outlet.id,
        Order.order_status == OrderStatus.PENDING,
        # ✅ BUGFIX: Ignore unpaid online orders in the notification counter
        or_(
            func.lower(Order.payment_method) == "cod",
            Order.payment_status == PaymentStatus.PAID
        )
    ).count()

    today_revenue = db.query(func.sum(Order.total_amount)).filter(
        Order.outlet_id == current_outlet.id,
        Order.payment_status == PaymentStatus.PAID,
        func.cast(Order.created_at, func.Date) == date.today()
    ).scalar() or 0.0

    # 🔍 SERVER LOG
    print(f"\n--- 📊 STATS FOR {current_outlet.outlet_name} ---")
    print(f"New: {new_orders_count} | Revenue: {today_revenue}\n")

    return {
        "new_orders": new_orders_count,
        "today_revenue": round(float(today_revenue), 2)
    }

# --- 2. GET ALL ORDERS ---
@router.get("", response_model=List[OrderResponse])
def get_outlet_orders(db: Session = Depends(get_db), current_outlet: Outlet = Depends(get_current_outlet)):
    """
    Fetch all orders for the logged-in outlet.
    """
    orders = (
        db.query(Order)
        .options(joinedload(Order.order_items).joinedload(OrderItem.product))
        .filter(
            Order.outlet_id == current_outlet.id,
            # ✅ BUGFIX: Hide orders that are online but not yet paid
            or_(
                func.lower(Order.payment_method) == "cod",
                Order.payment_status == PaymentStatus.PAID,
                Order.order_status != OrderStatus.PENDING
            )
        )
        .order_by(Order.created_at.desc())
        .all()
    )
    
    # 🔍 SERVER LOG
    print(f"📡 API Called: Found {len(orders)} orders for Outlet {current_outlet.id}")
    for o in orders:
        # Note: .value ensures the log shows the string 'pending' instead of the Enum object
        status_val = o.order_status.value if hasattr(o.order_status, 'value') else o.order_status
        print(f"   -> Order {o.order_number} | DB Status: {status_val}")

    return orders

@router.get("/out-for-delivery", response_model=List[OrderResponse])
def get_out_for_delivery_orders(
    page: int = 1,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_outlet: Outlet = Depends(get_current_outlet)
):
    skip = (page - 1) * limit

    orders = (
        db.query(Order)
        .options(joinedload(Order.order_items).joinedload(OrderItem.product))
        .filter(
            Order.outlet_id == current_outlet.id,
            Order.order_status == OrderStatus.OUT_FOR_DELIVERY
        )
        .order_by(Order.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    return orders

@router.get("/completed", response_model=List[OrderResponse])
def get_completed_orders(
    db: Session = Depends(get_db),
    current_outlet: Outlet = Depends(get_current_outlet)
):
    """
    Fetch ONLY delivered orders for outlet
    """

    orders = (
        db.query(Order)
        .options(joinedload(Order.order_items).joinedload(OrderItem.product))
        .filter(
            Order.outlet_id == current_outlet.id,
            Order.order_status == OrderStatus.DELIVERED
        )
        .order_by(Order.created_at.desc())
        .all()
    )

    print(f"✅ Completed Orders Found: {len(orders)}")

    return orders


@router.get("/orders")
def get_orders(
    page: int = 1,
    limit: int = 10,
    period: Optional[str] = "week",
    db: Session = Depends(get_db),
    current_outlet: Outlet = Depends(get_current_outlet)
):
    query = db.query(Order).filter(
        Order.outlet_id == current_outlet.id,
        Order.payment_status == PaymentStatus.PAID
    )

    # Apply period filter
    if period == "week":
        start_date = datetime.now() - timedelta(days=7)
        query = query.filter(Order.created_at >= start_date)

    elif period == "month":
        start_date = datetime.now() - timedelta(days=30)
        query = query.filter(Order.created_at >= start_date)

    orders = (
        query.order_by(Order.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    return orders

# ====================================================================
# ⚠️ DYNAMIC ROUTES BELOW THIS LINE ⚠️
# {order_id} must be at the bottom so it doesn't break static links!
# ====================================================================

# --- 3. GET SINGLE ORDER DETAILS ---
@router.get("/{order_id}", response_model=OrderResponse)
def get_order_details(order_id: int, db: Session = Depends(get_db), current_outlet: Outlet = Depends(get_current_outlet)):
    order = db.query(Order).options(joinedload(Order.order_items).joinedload(OrderItem.product)).filter(
        Order.id == order_id, Order.outlet_id == current_outlet.id
    ).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

# --- 4. UPDATE ORDER STATUS ---
# ✅ FIXED: Added response_model=OrderResponse and returning the order object
@router.put("/{order_id}/status", response_model=OrderResponse)
def update_order_status(
    order_id: int, 
    payload: OrderStatusUpdate, 
    db: Session = Depends(get_db), 
    current_outlet: Outlet = Depends(get_current_outlet)
):
    """
    Updates an order status and returns the updated object.
    """
    order = db.query(Order).filter(Order.id == order_id, Order.outlet_id == current_outlet.id).first()
    if not order: 
        raise HTTPException(status_code=404, detail="Order not found")

    new_status_val = payload.status.lower()
    
    # 🔍 SERVER LOG
    print(f"🔄 Updating {order.order_number}: to {new_status_val}")

    try:
        new_status = OrderStatus(new_status_val)
        order.order_status = new_status
        
        # Handle side effects for specific status changes
        if new_status == OrderStatus.CONFIRMED:
            # You could add confirmed_at here if your model supports it
            pass
        
        if new_status == OrderStatus.DELIVERED:
            order.delivered_at = datetime.now()
            order.payment_status = PaymentStatus.PAID

        db.commit()
        db.refresh(order)
        
        print(f"✅ DB Update Successful: {order.order_status}")
        
        # ✅ Return the order object so the frontend gets the full updated JSON
        return order
        
    except ValueError:
        db.rollback()
        print(f"❌ Invalid Status: {new_status_val}")
        raise HTTPException(status_code=400, detail=f"Invalid status: {new_status_val}")
    except Exception as e:
        db.rollback()
        print(f"❌ DB Update Failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Database error")