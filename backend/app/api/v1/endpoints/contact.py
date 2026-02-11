from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.core.database import get_db
from app.models import ContactInfo as ContactModel
from app.schemas.contact import Contact, ContactCreate

router = APIRouter()

@router.get("/", response_model=List[Contact])
def read_contacts(db: Session = Depends(get_db)):
    return db.query(ContactModel).all()

@router.post("/", response_model=Contact)
def create_contact(contact_in: ContactCreate, db: Session = Depends(get_db), current_user = Depends(deps.get_current_active_admin)):
    contact = ContactModel(**contact_in.model_dump())
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return contact

@router.put("/{contact_id}", response_model=Contact)
def update_contact(contact_id: int, contact_in: ContactCreate, db: Session = Depends(get_db), current_user = Depends(deps.get_current_active_admin)):
    contact = db.query(ContactModel).filter(ContactModel.id == contact_id).first()
    if not contact: raise HTTPException(status_code=404, detail="Contact info not found")
    for field, value in contact_in.model_dump().items():
        setattr(contact, field, value)
    db.commit()
    db.refresh(contact)
    return contact

@router.delete("/{contact_id}")
def delete_contact(contact_id: int, db: Session = Depends(get_db), current_user = Depends(deps.get_current_active_admin)):
    contact = db.query(ContactModel).filter(ContactModel.id == contact_id).first()
    if not contact: raise HTTPException(status_code=404, detail="Contact info not found")
    db.delete(contact)
    db.commit()
    return {"ok": True}