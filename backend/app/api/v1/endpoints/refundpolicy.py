import json
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Form
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session

from app.api import deps
from app.core.database import get_db
from app.core.redis_client import get_redis_client
from app.models import RefundPolicy as RefundPolicyModel
from app.models import User
from app.schemas.refundpolicy import (
    RefundPolicy,
    RefundPolicyCreate,
    RefundPolicyUpdate,
)
from app.tasks import notify_admin_event

router = APIRouter()


# ---------- HELPERS ----------
def clear_refund_policy_cache():
    try:
        r = get_redis_client()
        keys = list(r.scan_iter("refund_policy:*"))
        if keys:
            r.delete(*keys)
    except Exception as e:
        print(f"⚠️ Redis Warning: {e}")


# ---------- ROUTES ----------
@router.get("/", response_model=List[RefundPolicy])
def read_refund_policies(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    status: Optional[bool] = None,
):
    cache_key = f"refund_policy:{skip}:{limit}:{status}"

    try:
        redis = get_redis_client()
        cached = redis.get(cache_key)
        if cached:
            return json.loads(cached)
    except Exception:
        pass

    query = db.query(RefundPolicyModel)

    if status is not None:
        query = query.filter(RefundPolicyModel.status == status)

    policies = (
        query
        .order_by(RefundPolicyModel.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    try:
        redis.setex(cache_key, 600, json.dumps(jsonable_encoder(policies)))
    except Exception:
        pass

    return policies


@router.post("/", response_model=RefundPolicy)
def create_refund_policy(
    title: str = Form(...),
    description: str = Form(...),
    status: bool = Form(True),
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_admin),
):
    policy = RefundPolicyModel(
        title=title,
        description=description,
        status=status,
    )

    db.add(policy)
    db.commit()
    db.refresh(policy)

    clear_refund_policy_cache()
    notify_admin_event.delay("CREATE", f"Refund Policy Added: {policy.title}")

    return policy


@router.put("/{policy_id}", response_model=RefundPolicy)
def update_refund_policy(
    policy_id: int,
    title: str = Form(...),
    description: str = Form(...),
    status: bool = Form(True),
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_admin),
):
    policy = db.query(RefundPolicyModel).get(policy_id)
    if not policy:
        raise HTTPException(status_code=404, detail="Refund Policy not found")

    policy.title = title
    policy.description = description
    policy.status = status

    db.commit()
    db.refresh(policy)

    clear_refund_policy_cache()
    notify_admin_event.delay("UPDATE", f"Refund Policy Updated: {policy.id}")

    return policy


@router.delete("/{policy_id}", response_model=RefundPolicy)
def delete_refund_policy(
    policy_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_admin),
):
    policy = db.query(RefundPolicyModel).get(policy_id)
    if not policy:
        raise HTTPException(status_code=404, detail="Refund Policy not found")

    db.delete(policy)
    db.commit()

    clear_refund_policy_cache()
    notify_admin_event.delay("DELETE", f"Refund Policy Deleted: {policy_id}")

    return policy
