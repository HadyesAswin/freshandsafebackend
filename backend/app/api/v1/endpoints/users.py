from typing import Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api import deps
from app.core.database import get_db
from app.models import User

router = APIRouter()

@router.get("/", response_model=None)
def read_users(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    users = db.query(User).offset(skip).limit(limit).all()
    return [{"id": u.id, "email": u.email, "role": u.role} for u in users]