from typing import List
import json

from fastapi import APIRouter, Depends, HTTPException
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session

from app.api import deps
from app.core.database import get_db
from app.core.redis_client import get_redis_client
from app.models import Marquee as MarqueeModel
from app.schemas.marquee import Marquee, MarqueeCreate
from app.tasks import notify_admin_event

router = APIRouter()


# ---------- CACHE HELPER ----------
def clear_marquees_cache():
    try:
        r = get_redis_client()
        keys = list(r.scan_iter("marquees:*"))
        if keys:
            r.delete(*keys)
    except Exception as e:
        print(f"⚠️ Redis Warning: {e}")


# ---------- ROUTES ----------

@router.get("/", response_model=List[Marquee])
def read_marquees(db: Session = Depends(get_db)):
    cache_key = "marquees:all"

    # 1️⃣ Try Redis first
    try:
        redis = get_redis_client()
        cached = redis.get(cache_key)
        if cached:
            return json.loads(cached)
    except Exception:
        pass

    # 2️⃣ Fallback to DB
    marquees = db.query(MarqueeModel).all()

    # 3️⃣ Store in Redis for 10 minutes
    try:
        redis.setex(cache_key, 600, json.dumps(jsonable_encoder(marquees)))
    except Exception:
        pass

    return marquees


@router.post("/", response_model=Marquee)
def create_marquee(
    marquee_in: MarqueeCreate,
    db: Session = Depends(get_db),
    current_user = Depends(deps.get_current_active_admin)
):
    marquee = MarqueeModel(**marquee_in.model_dump())
    db.add(marquee)
    db.commit()
    db.refresh(marquee)

    clear_marquees_cache()
    notify_admin_event.delay("CREATE", f"Marquee Created: {marquee.id}")

    return marquee


@router.put("/{marquee_id}", response_model=Marquee)
def update_marquee(
    marquee_id: int,
    marquee_in: MarqueeCreate,
    db: Session = Depends(get_db),
    current_user = Depends(deps.get_current_active_admin)
):
    marquee = db.query(MarqueeModel).filter(MarqueeModel.id == marquee_id).first()
    if not marquee:
        raise HTTPException(status_code=404, detail="Marquee not found")

    marquee.text = marquee_in.text

    db.commit()
    db.refresh(marquee)

    clear_marquees_cache()
    notify_admin_event.delay("UPDATE", f"Marquee Updated: {marquee.id}")

    return marquee


@router.delete("/{marquee_id}")
def delete_marquee(
    marquee_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(deps.get_current_active_admin)
):
    marquee = db.query(MarqueeModel).filter(MarqueeModel.id == marquee_id).first()
    if not marquee:
        raise HTTPException(status_code=404, detail="Marquee not found")

    db.delete(marquee)
    db.commit()

    clear_marquees_cache()
    notify_admin_event.delay("DELETE", f"Marquee Deleted: {marquee_id}")

    return {"ok": True}