from typing import List
import json

from fastapi import APIRouter, Depends, HTTPException
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session

from app.api import deps
from app.core.database import get_db
from app.core.redis_client import get_redis_client
from app.models import DailyDeal as DealModel
from app.models import Product as ProductModel
from app.schemas.daily_deal import DailyDeal, DailyDealCreate
from app.tasks import notify_admin_event

router = APIRouter()


# ---------- CACHE HELPER ----------
def clear_deals_cache():
    try:
        r = get_redis_client()
        keys = list(r.scan_iter("deals:*"))
        if keys:
            r.delete(*keys)
    except Exception as e:
        print(f"⚠️ Redis Warning: {e}")


# ---------- ROUTES ----------

@router.get("/", response_model=List[DailyDeal])
def read_deals(db: Session = Depends(get_db)):
    cache_key = "deals:all"

    # Try Redis first
    try:
        redis = get_redis_client()
        cached = redis.get(cache_key)
        if cached:
            return json.loads(cached)
    except Exception:
        pass

    # Fallback to DB
    # ✅ Filter out deals where the associated product has been soft-deleted
    deals = db.query(DealModel).join(ProductModel).filter(ProductModel.is_deleted == False).all()

    # Store in Redis for 10 minutes
    try:
        redis.setex(cache_key, 600, json.dumps(jsonable_encoder(deals)))
    except Exception:
        pass

    return deals


@router.post("/", response_model=DailyDeal)
def create_deal(
    deal_in: DailyDealCreate,
    db: Session = Depends(get_db),
    current_user = Depends(deps.get_current_active_admin)
):
    # 1️⃣ Verify Product Exists AND is not deleted
    product = db.query(ProductModel).filter(ProductModel.id == deal_in.product_id, ProductModel.is_deleted == False).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found or has been deleted")

    # 2️⃣ Check if product already has deal
    existing = db.query(DealModel).filter(DealModel.product_id == deal_in.product_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="This product is already in Daily Deals")

    # 3️⃣ Create Deal
    deal = DealModel(**deal_in.model_dump())
    db.add(deal)
    db.commit()
    db.refresh(deal)

    # 4️⃣ Clear Cache + Notify
    clear_deals_cache()
    notify_admin_event.delay("CREATE", f"Daily Deal Created for Product ID: {deal.product_id}")

    return deal


@router.put("/{deal_id}", response_model=DailyDeal)
def update_deal(
    deal_id: int,
    deal_in: DailyDealCreate,
    db: Session = Depends(get_db),
    current_user = Depends(deps.get_current_active_admin)
):
    # 1️⃣ Find existing deal
    deal = db.query(DealModel).filter(DealModel.id == deal_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")

    # 2️⃣ Validate product change
    if deal_in.product_id != deal.product_id:
        # Make sure the new product isn't deleted either
        new_product = db.query(ProductModel).filter(ProductModel.id == deal_in.product_id, ProductModel.is_deleted == False).first()
        if not new_product:
            raise HTTPException(status_code=404, detail="New Product not found or has been deleted")

        existing = db.query(DealModel).filter(DealModel.product_id == deal_in.product_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="A deal already exists for this new product")

    # 3️⃣ Update fields
    deal.product_id = deal_in.product_id
    deal.offer_price = deal_in.offer_price

    db.commit()
    db.refresh(deal)

    # 4️⃣ Clear Cache + Notify
    clear_deals_cache()
    notify_admin_event.delay("UPDATE", f"Daily Deal Updated: {deal.id}")

    return deal


@router.delete("/{deal_id}")
def delete_deal(
    deal_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(deps.get_current_active_admin)
):
    deal = db.query(DealModel).filter(DealModel.id == deal_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")

    # ✅ HARD DELETE IS PERFECTLY FINE HERE
    db.delete(deal)
    db.commit()

    clear_deals_cache()
    notify_admin_event.delay("DELETE", f"Daily Deal Deleted: {deal_id}")

    return {"ok": True}