import json
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Form
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session

from app.api import deps
from app.core.database import get_db
from app.core.redis_client import get_redis_client
from app.models import TermsAndConditions as TermsModel
from app.models import User
from app.schemas.termsandconditions import TermsAndConditions
from app.tasks import notify_admin_event

router = APIRouter()


# ---------- HELPERS ----------
def clear_terms_cache():
    try:
        r = get_redis_client()
        keys = list(r.scan_iter("terms:*"))
        if keys:
            r.delete(*keys)
    except Exception as e:
        print(f"⚠️ Redis Warning: {e}")


# ---------- ROUTES ----------
@router.get("/", response_model=List[TermsAndConditions])
def read_terms(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    status: Optional[bool] = None,
):
    cache_key = f"terms:{skip}:{limit}:{status}"

    try:
        redis = get_redis_client()
        cached = redis.get(cache_key)
        if cached:
            return json.loads(cached)
    except Exception:
        pass

    query = db.query(TermsModel)

    if status is not None:
        query = query.filter(TermsModel.status == status)

    terms = (
        query
        .order_by(TermsModel.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    try:
        redis.setex(cache_key, 600, json.dumps(jsonable_encoder(terms)))
    except Exception:
        pass

    return terms


@router.post("/", response_model=TermsAndConditions)
def create_terms(
    title: str = Form(...),
    description: str = Form(...),
    status: bool = Form(True),
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_admin),
):
    terms = TermsModel(
        title=title,
        description=description,
        status=status,
    )

    db.add(terms)
    db.commit()
    db.refresh(terms)

    clear_terms_cache()
    notify_admin_event.delay("CREATE", f"Terms Added: {terms.title}")

    return terms


@router.put("/{terms_id}", response_model=TermsAndConditions)
def update_terms(
    terms_id: int,
    title: str = Form(...),
    description: str = Form(...),
    status: bool = Form(True),
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_admin),
):
    terms = db.query(TermsModel).get(terms_id)
    if not terms:
        raise HTTPException(status_code=404, detail="Terms not found")

    terms.title = title
    terms.description = description
    terms.status = status

    db.commit()
    db.refresh(terms)

    clear_terms_cache()
    notify_admin_event.delay("UPDATE", f"Terms Updated: {terms.id}")

    return terms


@router.delete("/{terms_id}", response_model=TermsAndConditions)
def delete_terms(
    terms_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_admin),
):
    terms = db.query(TermsModel).get(terms_id)
    if not terms:
        raise HTTPException(status_code=404, detail="Terms not found")

    db.delete(terms)
    db.commit()

    clear_terms_cache()
    notify_admin_event.delay("DELETE", f"Terms Deleted: {terms_id}")

    return terms

