from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.core.database import get_db
from app.models import Coupon, CouponCategory, CouponProduct
from app.schemas.coupon import Coupon as CouponSchema, CouponCreate, CouponUpdate

router = APIRouter()

@router.get("/", response_model=List[CouponSchema])
def read_coupons(db: Session = Depends(get_db)):
    return db.query(Coupon).all()

@router.post("/", response_model=CouponSchema)
def create_coupon(
    coupon_in: CouponCreate, 
    db: Session = Depends(get_db), 
    current_user = Depends(deps.get_current_active_admin)
):
    # 1. Check if Code Exists
    if db.query(Coupon).filter(Coupon.code == coupon_in.code).first():
        raise HTTPException(status_code=400, detail="Coupon code already exists")

    # 2. Separate relations from main data
    data = coupon_in.model_dump()
    cat_ids = data.pop("category_ids", [])
    prod_ids = data.pop("product_ids", [])

    # 3. Create Coupon
    coupon = Coupon(**data)
    db.add(coupon)
    db.commit()
    db.refresh(coupon)

    # 4. Add Categories
    if coupon.applicable_type == "category":
        for cid in cat_ids:
            db.add(CouponCategory(coupon_id=coupon.id, category_id=cid))
            
    # 5. Add Products
    if coupon.applicable_type == "product":
        for pid in prod_ids:
            db.add(CouponProduct(coupon_id=coupon.id, product_id=pid))

    db.commit()
    db.refresh(coupon)
    return coupon

@router.delete("/{coupon_id}")
def delete_coupon(coupon_id: int, db: Session = Depends(get_db), current_user = Depends(deps.get_current_active_admin)):
    coupon = db.query(Coupon).filter(Coupon.id == coupon_id).first()
    if not coupon: raise HTTPException(status_code=404, detail="Coupon not found")
    db.delete(coupon)
    db.commit()
    return {"ok": True}