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
    coupons = db.query(Coupon).all()

    # Store in Redis for 10 minutes
    try:
        redis.setex(cache_key, 600, json.dumps(jsonable_encoder(coupons)))
    except Exception:
        pass

    return coupons


@router.post("/", response_model=CouponSchema)
def create_coupon(
    coupon_in: CouponCreate,
    db: Session = Depends(get_db),
    current_user = Depends(deps.get_current_active_admin)
):
    # 1️⃣ Check if Code Exists
    if db.query(Coupon).filter(Coupon.code == coupon_in.code).first():
        raise HTTPException(status_code=400, detail="Coupon code already exists")

    # 2️⃣ Separate relations
    data = coupon_in.model_dump()
    cat_ids = data.pop("category_ids", [])
    prod_ids = data.pop("product_ids", [])

    # 3️⃣ Create Coupon
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
    notify_admin_event.delay("CREATE", f"Coupon Created: {coupon.code}")

    return coupon


@router.delete("/{coupon_id}")
def delete_coupon(
    coupon_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(deps.get_current_active_admin)
):
    coupon = db.query(Coupon).filter(Coupon.id == coupon_id).first()
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")

    db.delete(coupon)
    db.commit()

    clear_coupons_cache()
    notify_admin_event.delay("DELETE", f"Coupon Deleted: {coupon.code}")

    return {"ok": True}