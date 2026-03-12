from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import FAQ

router = APIRouter()

@router.get("/")
def get_public_faqs(db: Session = Depends(get_db)):
    faqs = db.query(FAQ).filter(FAQ.status == True).order_by(FAQ.display_order).all()
    return [{"id": f.id, "question": f.question, "answer": f.answer} for f in faqs]