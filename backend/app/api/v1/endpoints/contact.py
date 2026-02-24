from typing import List
import json

from fastapi import APIRouter, Depends, HTTPException
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session

from app.api import deps
from app.core.database import get_db
from app.core.redis_client import get_redis_client
from app.models import ContactInfo as ContactModel
from app.schemas.contact import Contact, ContactCreate
from app.tasks import notify_admin_event

router = APIRouter()


# ---------- CACHE HELPER ----------
def clear_contacts_cache():
    try:
        r = get_redis_client()
        keys = list(r.scan_iter("contacts:*"))
        if keys:
            r.delete(*keys)
    except Exception as e:
        print(f"⚠️ Redis Warning: {e}")


# ---------- ROUTES ----------

@router.get("/", response_model=List[Contact])
def read_contacts(db: Session = Depends(get_db)):
    cache_key = "contacts:all"

    # Try Redis first
    try:
        redis = get_redis_client()
        cached = redis.get(cache_key)
        if cached:
            return json.loads(cached)
    except Exception:
        pass

    # Fallback to DB
    contacts = db.query(ContactModel).all()

    # Store in Redis for 10 minutes
    try:
        redis.setex(cache_key, 600, json.dumps(jsonable_encoder(contacts)))
    except Exception:
        pass

    return contacts


@router.post("/", response_model=Contact)
def create_contact(
    contact_in: ContactCreate,
    db: Session = Depends(get_db),
    current_user = Depends(deps.get_current_active_admin)
):
    contact = ContactModel(**contact_in.model_dump())
    db.add(contact)
    db.commit()
    db.refresh(contact)

    clear_contacts_cache()
    notify_admin_event.delay("CREATE", "New Contact Info Added")

    return contact


@router.put("/{contact_id}", response_model=Contact)
def update_contact(
    contact_id: int,
    contact_in: ContactCreate,
    db: Session = Depends(get_db),
    current_user = Depends(deps.get_current_active_admin)
):
    contact = db.query(ContactModel).filter(ContactModel.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact info not found")

    for field, value in contact_in.model_dump().items():
        setattr(contact, field, value)

    db.commit()
    db.refresh(contact)

    clear_contacts_cache()
    notify_admin_event.delay("UPDATE", f"Contact Updated: {contact.id}")

    return contact


@router.delete("/{contact_id}")
def delete_contact(
    contact_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(deps.get_current_active_admin)
):
    contact = db.query(ContactModel).filter(ContactModel.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact info not found")

    db.delete(contact)
    db.commit()

    clear_contacts_cache()
    notify_admin_event.delay("DELETE", f"Contact Deleted: {contact_id}")

    return {"ok": True}