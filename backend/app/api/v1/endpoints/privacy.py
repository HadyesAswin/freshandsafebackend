from typing import List
import json

from fastapi import APIRouter, Depends, HTTPException
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session

from app.api import deps
from app.core.database import get_db
from app.core.redis_client import get_redis_client
from app.models import PrivacyPolicy as PrivacyModel
from app.schemas.privacy_policy import PrivacyPolicy, PrivacyPolicyCreate
from app.tasks import notify_admin_event

router = APIRouter()


# ---------- CACHE HELPER ----------
def clear_privacy_cache():
    try:
        r = get_redis_client()
        keys = list(r.scan_iter("privacy:*"))
        if keys:
            r.delete(*keys)
    except Exception as e:
        print(f"⚠️ Redis Warning: {e}")


# ---------- ROUTES ----------

@router.get("/", response_model=List[PrivacyPolicy])
def read_policies(db: Session = Depends(get_db)):
    cache_key = "privacy:all"

    # 1️⃣ Try Redis
    try:
        redis = get_redis_client()
        cached = redis.get(cache_key)
        if cached:
            return json.loads(cached)
    except Exception:
        pass

    # 2️⃣ Fallback to DB
    policies = db.query(PrivacyModel).order_by(PrivacyModel.display_order).all()

    # 3️⃣ Store in Redis (10 minutes)
    try:
        redis.setex(cache_key, 600, json.dumps(jsonable_encoder(policies)))
    except Exception:
        pass

    return policies


@router.post("/", response_model=PrivacyPolicy)
def create_policy(
    policy_in: PrivacyPolicyCreate,
    db: Session = Depends(get_db),
    current_user = Depends(deps.get_current_active_admin)
):
    policy = PrivacyModel(**policy_in.model_dump())
    db.add(policy)
    db.commit()
    db.refresh(policy)

    clear_privacy_cache()
    notify_admin_event.delay("CREATE", f"Privacy Policy Created: {policy.id}")

    return policy


@router.put("/{policy_id}", response_model=PrivacyPolicy)
def update_policy(
    policy_id: int,
    policy_in: PrivacyPolicyCreate,
    db: Session = Depends(get_db),
    current_user = Depends(deps.get_current_active_admin)
):
    policy = db.query(PrivacyModel).filter(PrivacyModel.id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")

    for field, value in policy_in.model_dump().items():
        setattr(policy, field, value)

    db.commit()
    db.refresh(policy)

    clear_privacy_cache()
    notify_admin_event.delay("UPDATE", f"Privacy Policy Updated: {policy.id}")

    return policy


@router.delete("/{policy_id}")
def delete_policy(
    policy_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(deps.get_current_active_admin)
):
    policy = db.query(PrivacyModel).filter(PrivacyModel.id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")

    db.delete(policy)
    db.commit()

    clear_privacy_cache()
    notify_admin_event.delay("DELETE", f"Privacy Policy Deleted: {policy_id}")

    return {"ok": True}