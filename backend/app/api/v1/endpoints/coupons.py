from typing import List
import json

from fastapi import APIRouter, Depends, HTTPException
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session

from app.api import deps
from app.core.database import get_db
from app.core.redis_client import get_redis_client
from app.models import Coupon, CouponCategory, CouponProduct
from app.schemas.coupon import Coupon as CouponSchema, CouponCreate, CouponUpdate
from app.tasks import notify_admin_event

router = APIRouter()

# ---------- CACHE HELPER ----------
def clear_coupons_cache():
    try:
        r = get_redis_client()
        keys = list(r.scan_iter("coupons:*"))
        if keys:
            r.delete(*keys)
    except Exception as e:
        print(f"⚠️ Redis Warning: {e}")

# ---------- ROUTES ----------

@router.get("/", response_model=List[CouponSchema])
def read_coupons(db: Session = Depends(get_db)):
    cache_key = "coupons:all"

    # Try Redis
    try:
        redis = get_redis_client()
        cached = redis.get(cache_key)
        if cached:
            return json.loads(cached)
    except Exception:
        pass

    # Fallback to DB
    # ✅ SOFT DELETE FILTER APPLIED HERE
    db_coupons = db.query(Coupon).filter(Coupon.is_deleted == False).all()

    # Force Pydantic to fully load the relationships BEFORE caching!
    coupons_out = [CouponSchema.model_validate(c) for c in db_coupons]

    # Store in Redis for 10 minutes
    try:
        redis.setex(cache_key, 600, json.dumps(jsonable_encoder(coupons_out)))
    except Exception:
        pass

    return coupons_out

@router.post("/", response_model=CouponSchema)
def create_coupon(
    coupon_in: CouponCreate,
    db: Session = Depends(get_db),
    current_user = Depends(deps.get_current_active_admin)
):
    # Separate relations
    data = coupon_in.model_dump()
    cat_ids = data.pop("category_ids", [])
    prod_ids = data.pop("product_ids", [])

    # 1️⃣ Check if Code Exists (Including soft-deleted ones)
    existing_coupon = db.query(Coupon).filter(Coupon.code == coupon_in.code).first()
    
    if existing_coupon:
        if not existing_coupon.is_deleted:
            # If it exists and is ACTIVE, reject it
            raise HTTPException(status_code=400, detail="Coupon code already exists and is active.")
        else:
            # ✅ FIX: If it exists but is SOFT DELETED, we "undelete" it and update it!
            for key, value in data.items():
                setattr(existing_coupon, key, value)
            
            existing_coupon.is_deleted = False # Undelete it
            
            # Clear old relations
            db.query(CouponCategory).filter(CouponCategory.coupon_id == existing_coupon.id).delete()
            db.query(CouponProduct).filter(CouponProduct.coupon_id == existing_coupon.id).delete()
            
            coupon = existing_coupon
    else:
        # 3️⃣ Create Brand New Coupon
        coupon = Coupon(**data)
        db.add(coupon)
    
    db.commit()
    db.refresh(coupon)

    # 4️⃣ Add Categories
    if coupon.applicable_type == "category":
        for cid in cat_ids:
            db.add(CouponCategory(coupon_id=coupon.id, category_id=cid))

    # 5️⃣ Add Products
    if coupon.applicable_type == "product":
        for pid in prod_ids:
            db.add(CouponProduct(coupon_id=coupon.id, product_id=pid))

    db.commit()
    db.refresh(coupon)

    # 6️⃣ Clear Cache + Notify
    clear_coupons_cache()
    notify_admin_event.delay("CREATE_OR_RESTORE", f"Coupon Created/Restored: {coupon.code}")

    return CouponSchema.model_validate(coupon)

@router.put("/{coupon_id}", response_model=CouponSchema)
def update_coupon(
    coupon_id: int,
    coupon_in: CouponUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(deps.get_current_active_admin)
):
    coupon = db.query(Coupon).filter(Coupon.id == coupon_id, Coupon.is_deleted == False).first()
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")

    # Check if they are changing the code to one that already exists
    if coupon_in.code and coupon_in.code != coupon.code:
        # Check against active coupons only. If they try to rename to a soft-deleted code, we block to prevent messy merges.
        existing = db.query(Coupon).filter(Coupon.code == coupon_in.code, Coupon.is_deleted == False).first()
        if existing:
            raise HTTPException(status_code=400, detail="That coupon code is already taken by an active coupon.")

    data = coupon_in.model_dump(exclude_unset=True)
    cat_ids = data.pop("category_ids", None)
    prod_ids = data.pop("product_ids", None)

    # Update basic fields
    for key, value in data.items():
        setattr(coupon, key, value)

    # Update categories if provided
    if cat_ids is not None:
        db.query(CouponCategory).filter(CouponCategory.coupon_id == coupon.id).delete()
        if coupon.applicable_type == "category":
            for cid in cat_ids:
                db.add(CouponCategory(coupon_id=coupon.id, category_id=cid))

    # Update products if provided
    if prod_ids is not None:
        db.query(CouponProduct).filter(CouponProduct.coupon_id == coupon.id).delete()
        if coupon.applicable_type == "product":
            for pid in prod_ids:
                db.add(CouponProduct(coupon_id=coupon.id, product_id=pid))

    db.commit()
    db.refresh(coupon)
    
    clear_coupons_cache()
    notify_admin_event.delay("UPDATE", f"Coupon Updated: {coupon.code}")
    
    return CouponSchema.model_validate(coupon)

@router.delete("/{coupon_id}")
def delete_coupon(
    coupon_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(deps.get_current_active_admin)
):
    coupon = db.query(Coupon).filter(Coupon.id == coupon_id).first()
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")

    # ✅ SOFT DELETE LOGIC APPLIED HERE
    coupon.is_deleted = True
    coupon.status = False
    
    db.commit()

    clear_coupons_cache()
    notify_admin_event.delay("DELETE", f"Coupon Deleted: {coupon.code}")

    return {"ok": True}