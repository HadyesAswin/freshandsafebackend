import json
from fastapi import APIRouter, Depends, HTTPException
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.redis_client import get_redis_client
from app.models import Product, ShopProduct

router = APIRouter()


# -----------------------------
# REDIS CACHE HELPERS
# -----------------------------
def get_cache_key(outlet_id: int) -> str:
    return f"outlet_products:{outlet_id}"


def clear_outlet_products_cache(outlet_id: int):
    try:
        redis = get_redis_client()
        redis.delete(get_cache_key(outlet_id))
    except Exception as e:
        print(f"⚠️ Redis Warning: {e}")


# -----------------------------
# GET OUTLET PRODUCTS
# -----------------------------
@router.get("/products/{outlet_id}")
def get_outlet_products(outlet_id: int, db: Session = Depends(get_db)):
    """
    Get all products and check if they are enabled for this outlet
    """

    cache_key = get_cache_key(outlet_id)

    # 1️⃣ Try Redis first
    try:
        redis = get_redis_client()
        cached = redis.get(cache_key)
        if cached:
            return json.loads(cached)
    except Exception:
        pass

    # 2️⃣ If not cached → Query DB
    products = db.query(Product).all()

    shop_products = db.query(ShopProduct).filter(
        ShopProduct.outlet_id == outlet_id
    ).all()

    enabled_product_ids = {sp.product_id for sp in shop_products}

    result = []

    for product in products:
        result.append({
            "id": product.id,
            "category_id": product.category_id,
            "name": product.name,
            "slug": product.slug,
            "description": product.description,
            "image": product.image,
            "price": product.price,
            "compare_price": product.compare_price,
            "unit": product.unit,
            "is_available": product.is_available,
            "status": product.status,
            "meta_title": product.meta_title,
            "meta_description": product.meta_description,
            "created_at": product.created_at,
            "updated_at": product.updated_at,
            "is_enabled": product.id in enabled_product_ids
        })

    # 3️⃣ Store in Redis (10 minutes)
    try:
        redis.setex(cache_key, 600, json.dumps(jsonable_encoder(result)))
    except Exception:
        pass

    return result


# -----------------------------
# TOGGLE PRODUCT FOR OUTLET
# -----------------------------
@router.post("/products/toggle")
def toggle_product(
    outlet_id: int,
    product_id: int,
    db: Session = Depends(get_db)
):
    """
    Toggle product for outlet
    """

    existing = db.query(ShopProduct).filter(
        ShopProduct.outlet_id == outlet_id,
        ShopProduct.product_id == product_id
    ).first()

    if existing:
        # Turn OFF (remove)
        db.delete(existing)
        db.commit()

        clear_outlet_products_cache(outlet_id)

        return {"message": "Product removed from outlet"}
    else:
        # Turn ON (add)
        new_item = ShopProduct(
            outlet_id=outlet_id,
            product_id=product_id,
            is_available=True
        )
        db.add(new_item)
        db.commit()

        clear_outlet_products_cache(outlet_id)

        return {"message": "Product added to outlet"}
