import json
import shutil
import os
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session

from app.api import deps
from app.core.database import get_db
from app.core.redis_client import get_redis_client
from app.models import Category as CategoryModel
from app.models import User
from app.schemas.category import Category
from app.tasks import notify_admin_event

router = APIRouter()

# --- HELPER: SAVE UPLOADED FILE ---
def save_upload_file(upload_file: UploadFile) -> str:
    """Saves the file to static/uploads and returns the relative URL path."""
    upload_dir = "static/uploads"
    if not os.path.exists(upload_dir):
        os.makedirs(upload_dir)
    
    file_path = os.path.join(upload_dir, upload_file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(upload_file.file, buffer)
    
    return f"/static/uploads/{upload_file.filename}"

def clear_categories_cache():
    try:
        r = get_redis_client()
        keys = list(r.scan_iter("categories:*"))
        if keys:
            r.delete(*keys)
    except Exception as e:
        print(f"⚠️ Redis Warning: {e}")

# 1. GET ALL CATEGORIES
@router.get("/", response_model=List[Category])
def read_categories(db: Session = Depends(get_db), skip: int = 0, limit: int = 100):
    cache_key = f"categories:{skip}:{limit}"
    try:
        redis = get_redis_client()
        cached_data = redis.get(cache_key)
        if cached_data:
            return json.loads(cached_data)
    except Exception:
        pass

    categories = db.query(CategoryModel).offset(skip).limit(limit).all()
    
    try:
        redis.setex(cache_key, 600, json.dumps(jsonable_encoder(categories)))
    except Exception:
        pass

    return categories

# 2. CREATE CATEGORY (Uses Form & File instead of Schema)
@router.post("/", response_model=Category)
def create_category(
    name: str = Form(...),
    slug: str = Form(...),
    description: Optional[str] = Form(None),
    display_order: int = Form(0),
    status: bool = Form(True),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_admin),
):
    # Check if slug already exists (Since it's manual and unique)
    existing = db.query(CategoryModel).filter(CategoryModel.slug == slug).first()
    if existing:
        raise HTTPException(status_code=400, detail="Slug already exists")

    image_url = save_upload_file(image) if image else None

    category = CategoryModel(
        name=name,
        slug=slug,
        description=description,
        image=image_url,
        display_order=display_order,
        status=status,
    )
    db.add(category)
    db.commit()
    db.refresh(category)

    clear_categories_cache()
    notify_admin_event.delay("CREATE", f"New Category: {category.name}")
    
    return category

# 3. UPDATE CATEGORY
@router.put("/{category_id}", response_model=Category)
def update_category(
    category_id: int,
    name: str = Form(...),
    slug: str = Form(...),
    description: Optional[str] = Form(None),
    display_order: int = Form(0),
    status: bool = Form(True),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_admin),
):
    category = db.query(CategoryModel).filter(CategoryModel.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    category.name = name
    category.slug = slug
    category.description = description
    category.display_order = display_order
    category.status = status

    if image:
        category.image = save_upload_file(image)

    db.add(category)
    db.commit()
    db.refresh(category)

    clear_categories_cache()
    notify_admin_event.delay("UPDATE", f"Category Updated: {category.name}")

    return category

# 4. DELETE CATEGORY
@router.delete("/{category_id}", response_model=Category)
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_admin),
):
    category = db.query(CategoryModel).filter(CategoryModel.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    name_backup = category.name
    db.delete(category)
    db.commit()

    clear_categories_cache()
    notify_admin_event.delay("DELETE", f"Category Deleted: {name_backup}")

    return category