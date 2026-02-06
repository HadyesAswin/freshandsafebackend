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
from app.models import Product as ProductModel
from app.models import User
from app.schemas.product import Product
from app.tasks import notify_admin_event

router = APIRouter()


# ---------- HELPERS ----------
def save_upload_file(upload_file: UploadFile) -> str:
    upload_dir = "static/uploads/products"
    os.makedirs(upload_dir, exist_ok=True)

    file_path = os.path.join(upload_dir, upload_file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(upload_file.file, buffer)

    return f"/static/uploads/products/{upload_file.filename}"


def clear_products_cache():
    try:
        r = get_redis_client()
        keys = list(r.scan_iter("products:*"))
        if keys:
            r.delete(*keys)
    except Exception as e:
        print(f"⚠️ Redis Warning: {e}")


# ---------- ROUTES ----------
@router.get("/", response_model=List[Product])
def read_products(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    category_id: Optional[int] = None,
):
    cache_key = f"products:{skip}:{limit}:{category_id}"

    try:
        redis = get_redis_client()
        cached = redis.get(cache_key)
        if cached:
            return json.loads(cached)
    except Exception:
        pass

    query = db.query(ProductModel)

    if category_id:
        query = query.filter(ProductModel.category_id == category_id)

    products = (
        query
        .order_by(ProductModel.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    try:
        redis.setex(cache_key, 600, json.dumps(jsonable_encoder(products)))
    except Exception:
        pass

    return products


@router.post("/", response_model=Product)
def create_product(
    category_id: int = Form(...),
    name: str = Form(...),
    slug: str = Form(...),
    price: float = Form(...),
    compare_price: Optional[float] = Form(None),
    unit: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    meta_title: Optional[str] = Form(None),
    meta_description: Optional[str] = Form(None),
    is_available: bool = Form(True),
    status: bool = Form(True),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_admin),
):
    image_url = save_upload_file(image) if image else None

    product = ProductModel(
        category_id=category_id,
        name=name,
        slug=slug,
        description=description,
        image=image_url,
        price=price,
        compare_price=compare_price,
        unit=unit,
        is_available=is_available,
        status=status,
        meta_title=meta_title,
        meta_description=meta_description,
    )

    db.add(product)
    db.commit()
    db.refresh(product)

    clear_products_cache()
    notify_admin_event.delay("CREATE", f"New Product Added: {product.name}")

    return product


@router.put("/{product_id}", response_model=Product)
def update_product(
    product_id: int,
    category_id: int = Form(...),
    name: str = Form(...),
    slug: str = Form(...),
    price: float = Form(...),
    compare_price: Optional[float] = Form(None),
    unit: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    meta_title: Optional[str] = Form(None),
    meta_description: Optional[str] = Form(None),
    is_available: bool = Form(True),
    status: bool = Form(True),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_admin),
):
    product = db.query(ProductModel).get(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    product.category_id = category_id
    product.name = name
    product.slug = slug
    product.description = description
    product.price = price
    product.compare_price = compare_price
    product.unit = unit
    product.is_available = is_available
    product.status = status
    product.meta_title = meta_title
    product.meta_description = meta_description

    if image:
        product.image = save_upload_file(image)

    db.commit()
    db.refresh(product)

    clear_products_cache()
    notify_admin_event.delay("UPDATE", f"Product Updated: {product.id}")

    return product


@router.delete("/{product_id}", response_model=Product)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_admin),
):
    product = db.query(ProductModel).get(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    db.delete(product)
    db.commit()

    clear_products_cache()
    notify_admin_event.delay("DELETE", f"Product Deleted: {product_id}")

    return product
