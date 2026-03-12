from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import PrivacyPolicy

router = APIRouter()

@router.get("/")
def get_public_privacy_policies(db: Session = Depends(get_db)):
    """
    Fetch all active Privacy Policy sections, ordered by display_order.
    """
    policies = (
        db.query(PrivacyPolicy)
        .filter(PrivacyPolicy.status == True)
        .order_by(PrivacyPolicy.display_order.asc()) # Respect the admin's chosen order
        .all()
    )
    
    return [
        {
            "id": p.id,
            "title": p.title,
            "description": p.description,
            "updated_at": p.updated_at or p.created_at
        }
        for p in policies
    ]