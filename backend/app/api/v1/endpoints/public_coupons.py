from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime
from app.core.database import get_db
from app.models import Coupon, Product
from app.schemas.coupon import CouponValidateRequest, CouponValidateResponse

router = APIRouter()
@router.post("/validate", response_model=CouponValidateResponse)
def validate_coupon(data: CouponValidateRequest, db: Session = Depends(get_db)):

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

    now = datetime.utcnow()

    # Date check
    if coupon.valid_from > now or coupon.valid_to < now:
        return {
            "valid": False,
            "discount": 0,
            "message": "Coupon expired"
        }

    # Minimum order check
    if data.subtotal < coupon.min_order_amount:
        return {
            "valid": False,
            "discount": 0,
            "message": f"Minimum order ₹{coupon.min_order_amount} required"
        }

    # Usage limit check
    if coupon.total_usage_limit and coupon.used_count >= coupon.total_usage_limit:
        return {
            "valid": False,
            "discount": 0,
            "message": "Coupon usage limit reached"
        }

    # =====================
    # Applicability Check
    # =====================

    if coupon.applicable_type == "product":
        allowed_products = [cp.product_id for cp in coupon.products]

        if not any(pid in allowed_products for pid in data.product_ids):
            return {
                "valid": False,
                "discount": 0,
                "message": "Coupon not applicable to this product"
            }

    elif coupon.applicable_type == "category":
        allowed_categories = [cc.category_id for cc in coupon.categories]

        product_categories = db.query(Product.category_id).filter(
            Product.id.in_(data.product_ids)
        ).all()

        product_category_ids = [pc[0] for pc in product_categories]

        if not any(cid in allowed_categories for cid in product_category_ids):
            return {
                "valid": False,
                "discount": 0,
                "message": "Coupon not applicable to this category"
            }

    # =====================
    # Discount Calculation
    # =====================

    discount = 0

    if coupon.discount_type == "percentage":
        discount = (data.subtotal * coupon.discount_value) / 100

        if coupon.max_discount_amount:
            discount = min(discount, coupon.max_discount_amount)

    elif coupon.discount_type == "fixed":
        discount = coupon.discount_value

    return {
        "valid": True,
        "discount": round(discount, 2),
        "message": "Coupon applied successfully"
    }
