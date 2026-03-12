from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from datetime import datetime
import json

from app.core.database import get_db
from app.core.redis_client import get_redis_client
from app.models import Coupon, Product, CouponUsage
from app.schemas.coupon import CouponValidateRequest, CouponValidateResponse
from fastapi.encoders import jsonable_encoder

router = APIRouter()

@router.post("/validate", response_model=CouponValidateResponse)
def validate_coupon(data: CouponValidateRequest, db: Session = Depends(get_db)):

    print("\n========== COUPON VALIDATION START ==========")

    # 1️⃣ IMMEDIATELY BLOCK GUEST USERS
    if not data.user_id:
        print("Guest User blocked from using coupons ❌")
        return {"valid": False, "discount": 0, "message": "Coupons are only available to logged-in users."}

    redis = get_redis_client()
    coupon_code = data.code.upper().strip()
    cache_key = f"coupons:{coupon_code}" # ✅ FIX: Match admin cache key format

    coupon = None

    # 🔹 Redis
    try:
        cached = redis.get(cache_key)

        if cached:
            coupon_data = json.loads(cached)
            # ✅ SOFT DELETE FILTER APPLIED HERE
            coupon = db.query(Coupon).options(
                joinedload(Coupon.categories),
                joinedload(Coupon.products)
            ).filter(Coupon.id == coupon_data["id"], Coupon.is_deleted == False).first()
        else:
            # ✅ SOFT DELETE FILTER APPLIED HERE
            coupon = db.query(Coupon).options(
                joinedload(Coupon.categories),
                joinedload(Coupon.products)
            ).filter(
                Coupon.code == coupon_code,
                Coupon.status == True,
                Coupon.is_deleted == False
            ).first()

            if coupon:
                redis.setex(cache_key, 300, json.dumps(jsonable_encoder(coupon)))

    except Exception as e:
        print("Redis error:", e)
        # ✅ SOFT DELETE FILTER APPLIED HERE
        coupon = db.query(Coupon).options(
            joinedload(Coupon.categories),
            joinedload(Coupon.products)
        ).filter(
            Coupon.code == coupon_code,
            Coupon.status == True,
            Coupon.is_deleted == False
        ).first()

    if not coupon:
        print("Invalid coupon ❌")
        return {"valid": False, "discount": 0, "message": "Invalid coupon code"}

    now = datetime.now() # ✅ FIX: Use local time to match admin panel

    # ✅ Date validation
    if coupon.valid_from > now:
        return {"valid": False, "discount": 0, "message": "Coupon is not active yet"}
        
    if coupon.valid_to < now:
        return {"valid": False, "discount": 0, "message": "Coupon has expired"}

    # ✅ Minimum order check (Moved up for strict enforcement)
    if data.subtotal < coupon.min_order_amount:
        return {
            "valid": False,
            "discount": 0,
            "message": f"Minimum order of ₹{coupon.min_order_amount} required"
        }

    # ✅ Global usage limit
    if coupon.total_usage_limit and coupon.used_count >= coupon.total_usage_limit:
        return {"valid": False, "discount": 0, "message": "Coupon usage limit reached"}

    # ✅ STRICT Per-user usage limit
    usage_count = db.query(CouponUsage).filter(
        CouponUsage.coupon_id == coupon.id,
        CouponUsage.user_id == data.user_id
    ).count()

    if usage_count >= coupon.usage_limit_per_user:
        return {
            "valid": False, 
            "discount": 0, 
            "message": f"You have already used this coupon (Limit: {coupon.usage_limit_per_user})"
        }

    # ✅ STRICT PRODUCT + CATEGORY LOGIC
    product_ids = [item.product_id for item in data.items]

    products = db.query(Product).filter(Product.id.in_(product_ids)).all()

    if not products:
        return {"valid": False, "discount": 0, "message": "Invalid products"}

    product_map = {p.id: p for p in products}

    eligible_amount = 0

    for item in data.items:

        product = product_map.get(item.product_id)
        if not product:
            continue

        line_total = product.price * item.quantity

        if coupon.applicable_type == "all":
            eligible_amount += line_total

        elif coupon.applicable_type == "category":
            coupon_category_ids = [c.category_id for c in coupon.categories]

            if product.category_id in coupon_category_ids:
                eligible_amount += line_total

        elif coupon.applicable_type == "product":
            coupon_product_ids = [p.product_id for p in coupon.products]

            if product.id in coupon_product_ids:
                eligible_amount += line_total

    if eligible_amount == 0:
        return {
            "valid": False,
            "discount": 0,
            "message": "Coupon not applicable to selected products"
        }

    # ✅ Discount calculation ONLY on eligible_amount
    discount = 0

    if coupon.discount_type == "percentage":
        discount = (eligible_amount * coupon.discount_value) / 100

        if coupon.max_discount_amount:
            discount = min(discount, coupon.max_discount_amount)

    elif coupon.discount_type == "fixed":
        # Apply fixed discount up to the eligible_amount
        discount = min(coupon.discount_value, eligible_amount)

    print("Eligible Amount:", eligible_amount)
    print("Final Discount:", round(discount, 2))
    print("========== END ==========\n")

    return {
        "valid": True,
        "discount": round(discount, 2),
        "message": "Coupon applied successfully"
    }