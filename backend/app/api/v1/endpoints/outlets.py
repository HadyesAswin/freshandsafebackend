from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.core.database import get_db
from app.core.security import get_password_hash # Import hashing function
from app.models import Outlet as OutletModel
from app.schemas.outlet import Outlet, OutletCreate, OutletUpdate

router = APIRouter()

@router.get("/", response_model=List[Outlet])
def read_outlets(db: Session = Depends(get_db)):
    return db.query(OutletModel).all()

@router.post("/", response_model=Outlet)
def create_outlet(
    outlet_in: OutletCreate, 
    db: Session = Depends(get_db), 
    current_user: Any = Depends(deps.get_current_active_admin)
):
    # 1. Check if email exists
    if db.query(OutletModel).filter(OutletModel.email == outlet_in.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    # 2. Hash Password & Create
    db_obj = OutletModel(
        outlet_name=outlet_in.outlet_name,
        email=outlet_in.email,
        hashed_password=get_password_hash(outlet_in.password), # Hash it!
        phone=outlet_in.phone,
        address=outlet_in.address,
        city=outlet_in.city,
        district=outlet_in.district,
        state=outlet_in.state,
        zipcode=outlet_in.zipcode,
        landmark=outlet_in.landmark,
        latitude=outlet_in.latitude,
        longitude=outlet_in.longitude,
        status=outlet_in.status
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.put("/{outlet_id}", response_model=Outlet)
def update_outlet(
    outlet_id: int, 
    outlet_in: OutletUpdate, 
    db: Session = Depends(get_db),
    current_user: Any = Depends(deps.get_current_active_admin)
):
    outlet = db.query(OutletModel).filter(OutletModel.id == outlet_id).first()
    if not outlet: raise HTTPException(status_code=404, detail="Outlet not found")

    # Update fields
    outlet_data = outlet_in.model_dump(exclude_unset=True)
    if "password" in outlet_data and outlet_data["password"]:
        outlet_data["hashed_password"] = get_password_hash(outlet_data["password"])
        del outlet_data["password"] # Remove plain text key
    
    for field, value in outlet_data.items():
        setattr(outlet, field, value)

    db.commit()
    db.refresh(outlet)
    return outlet

@router.delete("/{outlet_id}")
def delete_outlet(outlet_id: int, db: Session = Depends(get_db), current_user: Any = Depends(deps.get_current_active_admin)):
    outlet = db.query(OutletModel).filter(OutletModel.id == outlet_id).first()
    if not outlet: raise HTTPException(status_code=404, detail="Outlet not found")
    db.delete(outlet)
    db.commit()
    return {"ok": True}