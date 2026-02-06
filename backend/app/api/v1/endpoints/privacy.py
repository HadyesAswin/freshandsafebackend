from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.core.database import get_db
from app.models import PrivacyPolicy as PrivacyModel
from app.schemas.privacy_policy import PrivacyPolicy, PrivacyPolicyCreate

router = APIRouter()

@router.get("/", response_model=List[PrivacyPolicy])
def read_policies(db: Session = Depends(get_db)):
    return db.query(PrivacyModel).order_by(PrivacyModel.display_order).all()

@router.post("/", response_model=PrivacyPolicy)
def create_policy(policy_in: PrivacyPolicyCreate, db: Session = Depends(get_db), current_user = Depends(deps.get_current_active_admin)):
    policy = PrivacyModel(**policy_in.model_dump())
    db.add(policy)
    db.commit()
    db.refresh(policy)
    return policy

@router.put("/{policy_id}", response_model=PrivacyPolicy)
def update_policy(policy_id: int, policy_in: PrivacyPolicyCreate, db: Session = Depends(get_db), current_user = Depends(deps.get_current_active_admin)):
    policy = db.query(PrivacyModel).filter(PrivacyModel.id == policy_id).first()
    if not policy: raise HTTPException(status_code=404, detail="Policy not found")
    for field, value in policy_in.model_dump().items():
        setattr(policy, field, value)
    db.commit()
    db.refresh(policy)
    return policy

@router.delete("/{policy_id}")
def delete_policy(policy_id: int, db: Session = Depends(get_db), current_user = Depends(deps.get_current_active_admin)):
    policy = db.query(PrivacyModel).filter(PrivacyModel.id == policy_id).first()
    if not policy: raise HTTPException(status_code=404, detail="Policy not found")
    db.delete(policy)
    db.commit()
    return {"ok": True}