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
from app.models import Certificate as CertificateModel
from app.models import User
from app.schemas.certificate import Certificate
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


def clear_certificates_cache():
    try:
        r = get_redis_client()
        keys = list(r.scan_iter("certificates:*"))
        if keys:
            r.delete(*keys)
    except Exception as e:
        print(f"⚠️ Redis Warning: {e}")


# ---------- ROUTES ----------
@router.get("/", response_model=List[Certificate])
def read_certificates(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
):
    cache_key = f"certificates:{skip}:{limit}"

    try:
        redis = get_redis_client()
        cached = redis.get(cache_key)
        if cached:
            return json.loads(cached)
    except Exception:
        pass

    certificates = (
        db.query(CertificateModel)
        .order_by(CertificateModel.display_order)
        .offset(skip)
        .limit(limit)
        .all()
    )

    try:
        redis.setex(cache_key, 600, json.dumps(jsonable_encoder(certificates)))
    except Exception:
        pass

    return certificates


@router.post("/", response_model=Certificate)
def create_certificate(
    display_order: int = Form(0),
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_admin),
):
    image_url = save_upload_file(image)

    certificate = CertificateModel(
        image=image_url,
        display_order=display_order,
    )

    db.add(certificate)
    db.commit()
    db.refresh(certificate)

    clear_certificates_cache()
    notify_admin_event.delay("CREATE", "New Certificate Added")

    return certificate


@router.put("/{certificate_id}", response_model=Certificate)
def update_certificate(
    certificate_id: int,
    display_order: int = Form(0),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_admin),
):
    certificate = db.query(CertificateModel).get(certificate_id)
    if not certificate:
        raise HTTPException(status_code=404, detail="Certificate not found")

    certificate.display_order = display_order

    if image:
        certificate.image = save_upload_file(image)

    db.commit()
    db.refresh(certificate)

    clear_certificates_cache()
    notify_admin_event.delay("UPDATE", f"Certificate Updated: {certificate.id}")

    return certificate


@router.delete("/{certificate_id}", response_model=Certificate)
def delete_certificate(
    certificate_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_admin),
):
    certificate = db.query(CertificateModel).get(certificate_id)
    if not certificate:
        raise HTTPException(status_code=404, detail="Certificate not found")

    db.delete(certificate)
    db.commit()

    clear_certificates_cache()
    notify_admin_event.delay("DELETE", f"Certificate Deleted: {certificate_id}")

    return certificate
