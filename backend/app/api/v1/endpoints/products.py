import json
import shutil
import os
import time # ✅ Added for slug timestamping
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
from pydantic import BaseModel

router = APIRouter()


# ---------- HELPERS ----------
def save_upload_file(upload_file: UploadFile) -> str:
    # Ensure directory exists
    upload_dir = "static/uploads/products"
    os.makedirs(upload_dir, exist_ok=True)

    file_path = os.path.join(upload_dir, upload_file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(upload_file.file, buffer)

    # Return the URL path
    return f"/static/uploads/products/{upload_file.filename}"


def clear_products_cache():
    """
    Clears BOTH general product lists AND outlet specific product lists.
    This ensures Shops see new Admin products instantly.
    """
    try:
        r = get_redis_client()
        
        # 1. Clear General Product Cache (products:*)
        keys = list(r.scan_iter("products:*"))
        if keys:
            r.delete(*keys)
            
        # 2. ✅ CRITICAL FIX: Clear Outlet Cache (outlet_products:*)
        # This forces all shops to re-fetch the master product list next time they load.
        outlet_keys = list(r.scan_iter("outlet_products:*"))
        if outlet_keys:
            r.delete(*outlet_keys)
            
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

    # ✅ SOFT DELETE FILTER APPLIED HERE
    query = db.query(ProductModel).filter(ProductModel.is_deleted == False)

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
    images: List[UploadFile] = File(default=[]), # ✅ BUGFIX: Changed to default=[] to fix Pydantic validation error
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_admin),
):
    # ✅ Process Multiple Images
    image_urls = []
    if images:
        for img in images:
            if img.filename:
                image_urls.append(save_upload_file(img))

    # Fallback to keep primary `image` column populated for backwards compatibility
    primary_image = image_urls[0] if image_urls else None

    product = ProductModel(
        category_id=category_id,
        name=name,
        slug=slug,
        description=description,
        image=primary_image,
        images=image_urls, # ✅ SAVE JSON ARRAY
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
    
    # notify_admin_event.delay("CREATE", f"New Product Added: {product.name}")

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
    existing_images: str = Form("[]"), # ✅ TRACK WHICH OLD IMAGES WERE KEPT
    images: List[UploadFile] = File(default=[]), # ✅ BUGFIX: Changed to default=[] to fix Pydantic validation error
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_admin),
):
    # Ensure they can't update a deleted product
    product = db.query(ProductModel).filter(ProductModel.id == product_id, ProductModel.is_deleted == False).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # ✅ Parse existing kept images
    try:
        kept_images = json.loads(existing_images)
    except:
        kept_images = []

    # ✅ Process newly uploaded images
    new_image_urls = []
    if images:
        for img in images:
            if img.filename:
                new_image_urls.append(save_upload_file(img))

    # Combine them
    all_images = kept_images + new_image_urls
    primary_image = all_images[0] if all_images else None

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
    
    # Update imagery
    product.image = primary_image
    product.images = all_images

    db.commit()
    db.refresh(product)

    clear_products_cache()
    # notify_admin_event.delay("UPDATE", f"Product Updated: {product.id}")

    return product


# ==========================================
# QUICK TOGGLE: IN STOCK / STOCKOUT
# ==========================================
class ProductAvailabilityUpdate(BaseModel):
    is_available: bool

@router.patch("/{product_id}/availability", response_model=Product)
def toggle_product_availability(
    product_id: int,
    req: ProductAvailabilityUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_admin),
):
    product = db.query(ProductModel).filter(ProductModel.id == product_id, ProductModel.is_deleted == False).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    product.is_available = req.is_available
    db.commit()
    db.refresh(product)
    
    clear_products_cache()
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

    # ✅ SOFT DELETE LOGIC APPLIED HERE
    product.is_deleted = True
    product.status = False
    
    # ✅ FIX: Modify the slug to free up the original name for future use
    product.slug = f"{product.slug}-deleted-{int(time.time())}"
    
    db.commit()

    clear_products_cache()
    # notify_admin_event.delay("DELETE", f"Product Deleted: {product_id}")

    return product