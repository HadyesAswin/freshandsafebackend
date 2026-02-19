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
from app.models import Testimonial as TestimonialModel
from app.models import User
from app.schemas.testimonial import Testimonial

router = APIRouter()


# ---------- HELPERS ----------
def save_upload_file(upload_file: UploadFile) -> str:
    upload_dir = "static/uploads/testimonials"
    os.makedirs(upload_dir, exist_ok=True)

    file_path = os.path.join(upload_dir, upload_file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(upload_file.file, buffer)

    return f"/static/uploads/testimonials/{upload_file.filename}"


def clear_testimonials_cache():
    try:
        r = get_redis_client()
        keys = list(r.scan_iter("testimonials:*"))
        if keys:
            r.delete(*keys)
    except Exception as e:
        print(f"⚠️ Redis Warning: {e}")


# ---------- ROUTES ----------

# GET ALL TESTIMONIALS
@router.get("/", response_model=List[Testimonial])
def read_testimonials(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
):
    cache_key = f"testimonials:{skip}:{limit}"

    try:
        redis = get_redis_client()
        cached = redis.get(cache_key)
        if cached:
            return json.loads(cached)
    except Exception:
        pass

    testimonials = (
        db.query(TestimonialModel)
        .filter(TestimonialModel.status == True)
        .order_by(TestimonialModel.display_order.asc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    try:
        redis.setex(cache_key, 600, json.dumps(jsonable_encoder(testimonials)))
    except Exception:
        pass

    return testimonials


# CREATE TESTIMONIAL (ADMIN)
@router.post("/", response_model=Testimonial)
def create_testimonial(
    name: str = Form(...),
    description: str = Form(...),
    place: Optional[str] = Form(None),
    display_order: int = Form(0),
    status: bool = Form(True),
    photo: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_admin),
):
    photo_url = None
    if photo:
        photo_url = save_upload_file(photo)

    testimonial = TestimonialModel(
        name=name,
        description=description,
        place=place,
        display_order=display_order,
        status=status,
        photo=photo_url,
    )

    db.add(testimonial)
    db.commit()
    db.refresh(testimonial)

    clear_testimonials_cache()

    return testimonial


# UPDATE TESTIMONIAL (ADMIN)
@router.put("/{testimonial_id}", response_model=Testimonial)
def update_testimonial(
    testimonial_id: int,
    name: str = Form(...),
    description: str = Form(...),
    place: Optional[str] = Form(None),
    display_order: int = Form(0),
    status: bool = Form(True),
    photo: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_admin),
):
    testimonial = db.query(TestimonialModel).get(testimonial_id)

    if not testimonial:
        raise HTTPException(status_code=404, detail="Testimonial not found")

    testimonial.name = name
    testimonial.description = description
    testimonial.place = place
    testimonial.display_order = display_order
    testimonial.status = status

    if photo:
        testimonial.photo = save_upload_file(photo)

    db.commit()
    db.refresh(testimonial)

    clear_testimonials_cache()

    return testimonial


# DELETE TESTIMONIAL (ADMIN)
@router.delete("/{testimonial_id}", response_model=Testimonial)
def delete_testimonial(
    testimonial_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_admin),
):
    testimonial = db.query(TestimonialModel).get(testimonial_id)

    if not testimonial:
        raise HTTPException(status_code=404, detail="Testimonial not found")

    db.delete(testimonial)
    db.commit()

    clear_testimonials_cache()

    return testimonial
