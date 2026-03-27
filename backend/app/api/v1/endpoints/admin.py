from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy import extract, func
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import User, UserRole
from typing import Optional
from datetime import date
import math

from app.models import User, UserRole, ShopProduct, Product, Outlet

from app.schemas.admin import BulkStockUpdateRequest

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




# =====================================================
# ✅ NEW: FETCH STOCK FOR A SPECIFIC OUTLET
# =====================================================
@router.get("/stock/{outlet_id}")
def get_outlet_stock(outlet_id: int, db: Session = Depends(get_db)):
    from app.models import ShopProduct, Product
    try:
        # Fetch all active, undeleted products globally
        all_products = db.query(Product).filter(
            Product.status == True, 
            Product.is_deleted == False
        ).order_by(Product.name).all()

        # Fetch the existing stock links for this specific outlet
        outlet_links = db.query(ShopProduct).filter(ShopProduct.outlet_id == outlet_id).all()
        
        # Create a dictionary for instant lookup: {product_id: ShopProduct_Object}
        stock_map = {link.product_id: link for link in outlet_links}

        result = []
        for prod in all_products:
            # Check if this outlet already has a row for this product
            existing_link = stock_map.get(prod.id)
            
            result.append({
                # If no link exists, we pass a temporary ID (like "new_12") to the frontend
                "shop_product_id": existing_link.id if existing_link else f"new_{prod.id}", 
                "product_id": prod.id, # ✅ Needed for creating new links
                "product_name": prod.name,
                "image": prod.image,
                "unit": prod.unit,
                "stock": existing_link.stock if existing_link else 0,
                "low_stock_threshold": existing_link.low_stock_threshold if existing_link else 5,
                # If there's no link yet, it's technically not available
                "is_available": existing_link.is_available if existing_link else False 
            })
        
        return result
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


# =====================================================
# ✅ NEW: BULK UPDATE STOCK
# =====================================================
@router.post("/stock/update")
def update_outlet_stock(outlet_id: int, payload: BulkStockUpdateRequest, db: Session = Depends(get_db)):
    from app.models import ShopProduct 
    try:
        for item in payload.updates:
            # ✅ SAFETY FIX: Skip if the ID is missing/None
            if item.shop_product_id is None:
                continue

            id_str = str(item.shop_product_id)
            
            if id_str.startswith("new_"):
                real_product_id = int(id_str.replace("new_", ""))
                
                exists = db.query(ShopProduct).filter(
                    ShopProduct.product_id == real_product_id, 
                    ShopProduct.outlet_id == outlet_id
                ).first()

                if exists:
                    exists.stock = item.new_stock
                    exists.is_available = True if item.new_stock > 0 else False
                else:
                    new_link = ShopProduct(
                        product_id=real_product_id,
                        outlet_id=outlet_id,
                        stock=item.new_stock,
                        is_available=True if item.new_stock > 0 else False
                    )
                    db.add(new_link)
            else:
                # ✅ SAFETY FIX: Handle existing product update
                db.query(ShopProduct).filter(ShopProduct.id == int(item.shop_product_id)).update(
                    {
                        "stock": item.new_stock,
                        "is_available": True if item.new_stock > 0 else False
                    }
                )
        
        db.commit()
        return {"status": "success", "message": "Inventory updated successfully"}
    
    except Exception as e:
        db.rollback()
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))



# =====================================================
# FETCH ALL OUTLETS FOR ADMIN DROPDOWN
# =====================================================
@router.get("/outlets-list")
def get_admin_outlets_list(db: Session = Depends(get_db)):
    from app.models import Outlet 
    from sqlalchemy import or_ # ✅ Need this for the filter fix
    try:
        # ✅ FIX: Handle cases where is_deleted might be NULL (None)
        outlets = db.query(Outlet.id, Outlet.outlet_name).filter(
            or_(Outlet.is_deleted == False, Outlet.is_deleted == None)
        ).all()
        
        result = []
        for o in outlets:
            result.append({"id": o.id, "name": o.outlet_name})
            
        return result
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))