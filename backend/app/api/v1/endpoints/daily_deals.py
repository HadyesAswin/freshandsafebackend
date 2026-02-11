from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.core.database import get_db
from app.models import DailyDeal as DealModel
from app.models import Product as ProductModel
from app.schemas.daily_deal import DailyDeal, DailyDealCreate


router = APIRouter()

@router.get("/", response_model=List[DailyDeal])
def read_deals(db: Session = Depends(get_db)):
    return db.query(DealModel).all()

@router.post("/", response_model=DailyDeal)
def create_deal(
    deal_in: DailyDealCreate, 
    db: Session = Depends(get_db), 
    current_user = Depends(deps.get_current_active_admin)
):
    # 1. Verify Product Exists
    product = db.query(ProductModel).filter(ProductModel.id == deal_in.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # 2. Check if this product already has a deal
    existing = db.query(DealModel).filter(DealModel.product_id == deal_in.product_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="This product is already in Daily Deals")

    # 3. Create Deal
    deal = DealModel(**deal_in.model_dump())
    db.add(deal)
    db.commit()
    db.refresh(deal)
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
    
    db.delete(deal)
    db.commit()
    return {"ok": True}

@router.put("/{deal_id}", response_model=DailyDeal)
def update_deal(
    deal_id: int, 
    deal_in: DailyDealCreate, 
    db: Session = Depends(get_db), 
    current_user = Depends(deps.get_current_active_admin)
):
    # 1. Find the existing deal
    deal = db.query(DealModel).filter(DealModel.id == deal_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")

    # 2. Validation: If they are changing the product, check if the NEW product already has a deal
    if deal_in.product_id != deal.product_id:
        existing = db.query(DealModel).filter(DealModel.product_id == deal_in.product_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="A deal already exists for this new product")

    # 3. Update fields
    deal.product_id = deal_in.product_id
    deal.offer_price = deal_in.offer_price
    
    db.commit()
    db.refresh(deal)
    return deal