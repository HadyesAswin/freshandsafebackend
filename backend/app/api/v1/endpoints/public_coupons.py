from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime
import json

from app.core.database import get_db
from app.core.redis_client import get_redis_client
from app.models import Coupon, Product
from app.schemas.coupon import CouponValidateRequest, CouponValidateResponse
from fastapi.encoders import jsonable_encoder

router = APIRouter()


@router.post("/validate", response_model=CouponValidateResponse)
def validate_coupon(data: CouponValidateRequest, db: Session = Depends(get_db)):

    redis = get_redis_client()
    cache_key = f"coupon:{data.code.upper()}"

    # 🔹 Try Redis first
    try:
        cached = redis.get(cache_key)
        if cached:
            coupon_data = json.loads(cached)
        else:
            coupon = db.query(Coupon).filter(
                Coupon.code == data.code.upper(),
                Coupon.status == True
            ).first()

            if not coupon:
                return {
                    "valid": False,
                    "discount": 0,
                    "message": "Invalid coupon code"
                }

            coupon_data = jsonable_encoder(coupon)

            # Cache for 5 minutes
            redis.setex(cache_key, 300, json.dumps(coupon_data))

    except Exception:
        coupon = db.query(Coupon).filter(
            Coupon.code == data.code.upper(),
            Coupon.status == True
        ).first()

        if not coupon:
            return {
                "valid": False,
                "discount": 0,
                "message": "Invalid coupon code"
            }

        coupon_data = jsonable_encoder(coupon)

    now = datetime.utcnow()

    # 🔹 Date check
    if coupon_data["valid_from"] > now.isoformat() or coupon_data["valid_to"] < now.isoformat():
        return {
            "valid": False,
            "discount": 0,
            "message": "Coupon expired"
        }

    # 🔹 Minimum order check
    if data.subtotal < coupon_data["min_order_amount"]:
        return {
            "valid": False,
            "discount": 0,
            "message": f"Minimum order ₹{coupon_data['min_order_amount']} required"
        }

    # 🔹 Discount Calculation
    discount = 0

    if coupon_data["discount_type"] == "percentage":
        discount = (data.subtotal * coupon_data["discount_value"]) / 100

        if coupon_data["max_discount_amount"]:
            discount = min(discount, coupon_data["max_discount_amount"])

    elif coupon_data["discount_type"] == "fixed":
        discount = coupon_data["discount_value"]

    return {
        "valid": True,
        "discount": round(discount, 2),
        "message": "Coupon applied successfully"
    }