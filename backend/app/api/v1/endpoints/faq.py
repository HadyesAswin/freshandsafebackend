from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.core.database import get_db
from app.models import FAQ as FAQModel
from app.schemas.faq import FAQ, FAQCreate

router = APIRouter()

@router.get("/", response_model=List[FAQ])
def read_faqs(db: Session = Depends(get_db), skip: int = 0, limit: int = 100):
    return db.query(FAQModel).order_by(FAQModel.display_order).offset(skip).limit(limit).all()

@router.post("/", response_model=FAQ)
def create_faq(
    faq_in: FAQCreate,
    db: Session = Depends(get_db),
    current_user = Depends(deps.get_current_active_admin)
):
    faq = FAQModel(**faq_in.model_dump())
    db.add(faq)
    db.commit()
    db.refresh(faq)
    return faq

@router.put("/{faq_id}", response_model=FAQ)
def update_faq(
    faq_id: int,
    faq_in: FAQCreate,
    db: Session = Depends(get_db),
    current_user = Depends(deps.get_current_active_admin)
):
    faq = db.query(FAQModel).filter(FAQModel.id == faq_id).first()
    if not faq: raise HTTPException(status_code=404, detail="FAQ not found")
    
    for field, value in faq_in.model_dump().items():
        setattr(faq, field, value)
    
    db.commit()
    db.refresh(faq)
    return faq

@router.delete("/{faq_id}")
def delete_faq(faq_id: int, db: Session = Depends(get_db), current_user = Depends(deps.get_current_active_admin)):
    faq = db.query(FAQModel).filter(FAQModel.id == faq_id).first()
    if not faq: raise HTTPException(status_code=404, detail="FAQ not found")
    db.delete(faq)
    db.commit()
    return {"ok": True}