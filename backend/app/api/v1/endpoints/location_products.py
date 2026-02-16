from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Product, ShopProduct, DailyDeal, Category
from app.services.map_service import (
    get_lat_lng_from_zipcode,
    get_nearby_outlets
)

router = APIRouter()


@router.get("/")
def get_home_data(zipcode: str, db: Session = Depends(get_db)):

    # 1️⃣ Get user location
    user_lat, user_lng = get_lat_lng_from_zipcode(zipcode)

    if not user_lat:
        raise HTTPException(status_code=404, detail="Invalid zipcode")

    # 2️⃣ Find nearby outlets
    nearby_outlets = get_nearby_outlets(db, user_lat, user_lng)
    outlet_ids = [outlet.id for outlet in nearby_outlets]

    if not outlet_ids:
        return {
            "daily_deals": [],
            "categories": [],
            "products": []
        }

    # 3️⃣ Get products
    products = (
        db.query(Product)
        .join(ShopProduct, ShopProduct.product_id == Product.id)
        .outerjoin(DailyDeal, DailyDeal.product_id == Product.id)
        .filter(
            ShopProduct.outlet_id.in_(outlet_ids),
            ShopProduct.is_available == True,
            Product.status == True,
            Product.is_available == True
        )
        .all()
    )

    daily_deals = []
    normal_products = []
    category_ids = set()

    for product in products:

        category_ids.add(product.category_id)

        if product.daily_deal:
            daily_deals.append({
                "id": product.id,
                "name": product.name,
                "image": product.image,
                "price": product.daily_deal.offer_price,
                "original_price": product.price
            })
        else:
            normal_products.append({
                "id": product.id,
                "name": product.name,
                "image": product.image,
                "price": product.price
            })

    # 4️⃣ Fetch categories related to those products
    categories = (
        db.query(Category)
        .filter(Category.id.in_(category_ids), Category.status == True)
        .order_by(Category.display_order)
        .all()
    )

    category_list = [
        {
            "id": cat.id,
            "name": cat.name,
            "image": cat.image,
            "slug": cat.slug
        }
        for cat in categories
    ]

    return {
        "daily_deals": daily_deals,
        "categories": category_list,
        "products": normal_products[:6]  # show only 6 on homepage
    }
