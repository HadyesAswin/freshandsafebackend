from typing import List
import json

from fastapi import APIRouter, Depends, HTTPException
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session

from app.api import deps
from app.core.database import get_db
from app.core.redis_client import get_redis_client
from app.models import FAQ as FAQModel
from app.schemas.faq import FAQ, FAQCreate
from app.tasks import notify_admin_event

router = APIRouter()


# ---------- CACHE HELPER ----------
def clear_faqs_cache():
    try:
        r = get_redis_client()
        keys = list(r.scan_iter("faqs:*"))
        if keys:
            r.delete(*keys)
    except Exception as e:
        print(f"⚠️ Redis Warning: {e}")


# ---------- ROUTES ----------

@router.get("/", response_model=List[FAQ])
def read_faqs(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    cache_key = f"faqs:{skip}:{limit}"

    # 1️⃣ Try Redis
    try:
        redis = get_redis_client()
        cached = redis.get(cache_key)
        if cached:
            return json.loads(cached)
    except Exception:
        pass

    # 2️⃣ Fallback to DB
    faqs = (
        db.query(FAQModel)
        .order_by(FAQModel.display_order)
        .offset(skip)
        .limit(limit)
        .all()
    )

    # 3️⃣ Store in Redis (10 minutes)
    try:
        redis.setex(cache_key, 600, json.dumps(jsonable_encoder(faqs)))
    except Exception:
        pass

    return faqs


@router.post("/", response_model=FAQ)
def create_faq(
    faq_in: FAQCreate,
    db: Session = Depends(get_db),
    current_user = Depends(deps.get_current_active_admin)
):
    faq = FAQModel(**faq_in.model_dump())
    db.add(faq)
    db.commit()
    db.refresh(faq)

    clear_faqs_cache()
    notify_admin_event.delay("CREATE", f"FAQ Created: {faq.id}")

    return faq


@router.put("/{faq_id}", response_model=FAQ)
def update_faq(
    faq_id: int,
    faq_in: FAQCreate,
    db: Session = Depends(get_db),
    current_user = Depends(deps.get_current_active_admin)
):
    faq = db.query(FAQModel).filter(FAQModel.id == faq_id).first()
    if not faq:
        raise HTTPException(status_code=404, detail="FAQ not found")

    for field, value in faq_in.model_dump().items():
        setattr(faq, field, value)

    db.commit()
    db.refresh(faq)

    clear_faqs_cache()
    notify_admin_event.delay("UPDATE", f"FAQ Updated: {faq.id}")

    return faq


@router.delete("/{faq_id}")
def delete_faq(
    faq_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(deps.get_current_active_admin)
):
    faq = db.query(FAQModel).filter(FAQModel.id == faq_id).first()
    if not faq:
        raise HTTPException(status_code=404, detail="FAQ not found")

    db.delete(faq)
    db.commit()

    clear_faqs_cache()
    notify_admin_event.delay("DELETE", f"FAQ Deleted: {faq_id}")

    return {"ok": True}