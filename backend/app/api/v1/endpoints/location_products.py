from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Product, ShopProduct
from app.services.map_service import (
    get_lat_lng_from_zipcode,
    get_nearby_outlets
)

router = APIRouter()


@router.get("/")
def get_products_by_zipcode(zipcode: str, db: Session = Depends(get_db)):

    # 1️⃣ Convert zipcode → lat/lng
    user_lat, user_lng = get_lat_lng_from_zipcode(zipcode)

    if not user_lat:
        raise HTTPException(status_code=404, detail="Invalid zipcode")

    # 2️⃣ Find nearby outlets
    nearby_outlets = get_nearby_outlets(db, user_lat, user_lng)
    outlet_ids = [outlet.id for outlet in nearby_outlets]

    if not outlet_ids:
        return []

    # 3️⃣ Get products from those outlets
    products = db.query(Product)\
        .join(ShopProduct, ShopProduct.product_id == Product.id)\
        .filter(
            ShopProduct.outlet_id.in_(outlet_ids),
            ShopProduct.is_available == True,
            Product.status == True,
            Product.is_available == True
        )\
        .all()

    return products
