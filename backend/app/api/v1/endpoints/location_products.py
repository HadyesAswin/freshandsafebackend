from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
# ✅ Import Marquee and Banner models
from app.models import Product, ShopProduct, DailyDeal, Category, Marquee, Banner
from app.services.map_service import get_lat_lng_from_zipcode, get_nearby_outlets

router = APIRouter()

@router.get("/")
def get_home_data(zipcode: str, db: Session = Depends(get_db)):
    # 1. Fetch Marquee (Latest one)
    marquee = db.query(Marquee).order_by(Marquee.created_at.desc()).first()
    marquee_text = marquee.text if marquee else "Welcome to Fresh&Safe!"

    # 2. Fetch Banners
    banners = db.query(Banner).order_by(Banner.display_order).all()
    banner_list = [{"id": b.id, "image": b.image, "url": b.url} for b in banners]

    # 3. Location & Outlets Logic (Existing)
    user_lat, user_lng = get_lat_lng_from_zipcode(zipcode)
    
    if not user_lat:
        # Return basic data even if zipcode is invalid (so banners/marquee still show)
        return {
            "marquee": marquee_text,
            "banners": banner_list,
            "daily_deals": [],
            "categories": [],
            "products": [],
            "valid_location": False
        }

    nearby_outlets = get_nearby_outlets(db, user_lat, user_lng)
    outlet_ids = [outlet.id for outlet in nearby_outlets]

    if not outlet_ids:
        return {
            "marquee": marquee_text,
            "banners": banner_list,
            "daily_deals": [],
            "categories": [],
            "products": [],
            "valid_location": False
        }

    # 4. Get Products (Existing)
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

    # 5. Get Categories
    categories = (
        db.query(Category)
        .filter(Category.id.in_(category_ids), Category.status == True)
        .order_by(Category.display_order)
        .all()
    )

    category_list = [{"id": c.id, "name": c.name, "image": c.image, "slug": c.slug} for c in categories]

    return {
        "marquee": marquee_text,
        "banners": banner_list,
        "daily_deals": daily_deals,
        "categories": category_list,
        "products": normal_products[:6],
        "valid_location": True
    }


# ... existing imports ...

@router.get("/category/{slug}")
def get_products_by_category(slug: str, zipcode: str, db: Session = Depends(get_db)):
    # 1. Get User Location from Zipcode
    user_lat, user_lng = get_lat_lng_from_zipcode(zipcode)
    if not user_lat:
        raise HTTPException(status_code=404, detail="Invalid zipcode")

    # 2. Find the Category ID from the Slug (e.g., "vegetables" -> ID 1)
    category = db.query(Category).filter(Category.slug == slug).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    # 3. Find Nearby Shops
    nearby_outlets = get_nearby_outlets(db, user_lat, user_lng)
    outlet_ids = [outlet.id for outlet in nearby_outlets]

    if not outlet_ids:
        return {"category_name": category.name, "products": []}

    # 4. Fetch Products that match Category AND Location
    products = (
        db.query(Product)
        .join(ShopProduct, ShopProduct.product_id == Product.id)
        .filter(
            Product.category_id == category.id,       # <--- Filter by Category
            ShopProduct.outlet_id.in_(outlet_ids),    # <--- Filter by Location
            ShopProduct.is_available == True,
            Product.status == True,
            Product.is_available == True
        )
        .all()
    )

    # 5. Return clean JSON
    return {
        "category_name": category.name,
        "products": [
            {
                "id": p.id,
                "name": p.name,
                "image": p.image,
                "price": p.price,
                "compare_price": p.compare_price,
                "unit": p.unit
            }
            for p in products
        ]
    }