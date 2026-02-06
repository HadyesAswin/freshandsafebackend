from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.core.database import get_db
from app.models import Marquee as MarqueeModel
from app.schemas.marquee import Marquee, MarqueeCreate

router = APIRouter()

@router.get("/", response_model=List[Marquee])
def read_marquees(db: Session = Depends(get_db)):
    return db.query(MarqueeModel).all()

@router.post("/", response_model=Marquee)
def create_marquee(marquee_in: MarqueeCreate, db: Session = Depends(get_db), current_user = Depends(deps.get_current_active_admin)):
    marquee = MarqueeModel(**marquee_in.model_dump())
    db.add(marquee)
    db.commit()
    db.refresh(marquee)
    return marquee

@router.put("/{marquee_id}", response_model=Marquee)
def update_marquee(marquee_id: int, marquee_in: MarqueeCreate, db: Session = Depends(get_db), current_user = Depends(deps.get_current_active_admin)):
    marquee = db.query(MarqueeModel).filter(MarqueeModel.id == marquee_id).first()
    if not marquee: raise HTTPException(status_code=404, detail="Marquee not found")
    marquee.text = marquee_in.text
    db.commit()
    db.refresh(marquee)
    return marquee

@router.delete("/{marquee_id}")
def delete_marquee(marquee_id: int, db: Session = Depends(get_db), current_user = Depends(deps.get_current_active_admin)):
    marquee = db.query(MarqueeModel).filter(MarqueeModel.id == marquee_id).first()
    if not marquee: raise HTTPException(status_code=404, detail="Marquee not found")
    db.delete(marquee)
    db.commit()
    return {"ok": True}