from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import TermsAndConditions

router = APIRouter()

@router.get("/")
def get_public_terms(db: Session = Depends(get_db)):
    """
    Fetch all active Terms and Conditions documents.
    """
    terms = (
        db.query(TermsAndConditions)
        .filter(TermsAndConditions.status == True)
        .order_by(TermsAndConditions.id.asc()) # Ordering by ID or creation so they show in a logical sequence
        .all()
    )
    
    return [
        {
            "id": t.id,
            "title": t.title,
            "description": t.description,
            "updated_at": t.updated_at or t.created_at
        }
        for t in terms
    ]