from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import RefundPolicy

router = APIRouter()

@router.get("/")
def get_public_refund_policy(db: Session = Depends(get_db)):
    """
    Fetch all active Refund Policy documents.
    """
    policies = (
        db.query(RefundPolicy)
        .filter(RefundPolicy.status == True)
        .order_by(RefundPolicy.id.asc())
        .all()
    )
    
    return [
        {
            "id": r.id,
            "title": r.title,
            "description": r.description,
            "updated_at": r.updated_at or r.created_at
        }
        for r in policies
    ]