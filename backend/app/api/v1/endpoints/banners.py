import json
import shutil
import os
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session

from app.api import deps
from app.core.database import get_db
from app.core.redis_client import get_redis_client
from app.models import Banner as BannerModel
from app.models import User
from app.schemas.banner import Banner
from app.tasks import notify_admin_event

router = APIRouter()


# ---------- HELPERS ----------
def save_upload_file(upload_file: UploadFile) -> str:
    upload_dir = "static/uploads"
    os.makedirs(upload_dir, exist_ok=True)

    file_path = os.path.join(upload_dir, upload_file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(upload_file.file, buffer)

    return f"/static/uploads/{upload_file.filename}"


def clear_banners_cache():
    try:
        r = get_redis_client()
        keys = list(r.scan_iter("banners:*"))
        if keys:
            r.delete(*keys)
    except Exception as e:
        print(f"⚠️ Redis Warning: {e}")


# ---------- ROUTES ----------
@router.get("/", response_model=List[Banner])
def read_banners(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
):
    cache_key = f"banners:{skip}:{limit}"

    try:
        redis = get_redis_client()
        cached = redis.get(cache_key)
        if cached:
            return json.loads(cached)
    except Exception:
        pass

    banners = (
        db.query(BannerModel)
        .order_by(BannerModel.display_order)
        .offset(skip)
        .limit(limit)
        .all()
    )

    try:
        redis.setex(cache_key, 600, json.dumps(jsonable_encoder(banners)))
    except Exception:
        pass

    return banners


@router.post("/", response_model=Banner)
def create_banner(
    display_order: int = Form(0),
    url: Optional[str] = Form(None),
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_admin),
):
    image_url = save_upload_file(image)

    banner = BannerModel(
        image=image_url,
        display_order=display_order,
        url=url,
    )

    db.add(banner)
    db.commit()
    db.refresh(banner)

    clear_banners_cache()
    notify_admin_event.delay("CREATE", "New Banner Added")

    return banner


@router.put("/{banner_id}", response_model=Banner)
def update_banner(
    banner_id: int,
    display_order: int = Form(0),
    url: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_admin),
):
    banner = db.query(BannerModel).get(banner_id)
    if not banner:
        raise HTTPException(status_code=404, detail="Banner not found")

    banner.display_order = display_order
    banner.url = url

    if image:
        banner.image = save_upload_file(image)

    db.commit()
    db.refresh(banner)

    clear_banners_cache()
    notify_admin_event.delay("UPDATE", f"Banner Updated: {banner.id}")

    return banner


@router.delete("/{banner_id}", response_model=Banner)
def delete_banner(
    banner_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_admin),
):
    banner = db.query(BannerModel).get(banner_id)
    if not banner:
        raise HTTPException(status_code=404, detail="Banner not found")

    db.delete(banner)
    db.commit()

    clear_banners_cache()
    notify_admin_event.delay("DELETE", f"Banner Deleted: {banner_id}")

    return banner
