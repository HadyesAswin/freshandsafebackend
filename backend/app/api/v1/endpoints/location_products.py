from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Product, ShopProduct, DailyDeal, Category, Marquee, Banner, Outlet
from app.services.map_service import get_lat_lng_from_zipcode, get_nearby_outlets

router = APIRouter()

@router.get("/")
def get_home_data(zipcode: str, db: Session = Depends(get_db)):
    # 1. Fetch Marquee & Banners (These can show even if shops are closed)
    marquee = db.query(Marquee).order_by(Marquee.created_at.desc()).first()
    marquee_text = marquee.text if marquee else "Welcome to Fresh&Safe!"

    banners = db.query(Banner).order_by(Banner.display_order).all()
    banner_list = [{"id": b.id, "image": b.image, "url": b.url} for b in banners]

    # 2. Location Logic
    user_lat, user_lng = get_lat_lng_from_zipcode(zipcode)
    
    if not user_lat:
        return {
            "marquee": marquee_text,
            "banners": banner_list,
            "daily_deals": [],
            "categories": [],
            "products": [],
            "valid_location": False
        }

    # 3. Get Nearby Outlets
    nearby_outlets = get_nearby_outlets(db, user_lat, user_lng)

    # ✅ FILTER: Only include outlets where status is TRUE (Open)
    # This single line ensures products from closed shops are NEVER fetched.
    active_outlets = [outlet for outlet in nearby_outlets if outlet.status is True]
    
    outlet_ids = [outlet.id for outlet in active_outlets]

    # If no active outlets are found nearby
    if not outlet_ids:
        return {
            "marquee": marquee_text,
            "banners": banner_list,
            "daily_deals": [],
            "categories": [],
            "products": [],
            "valid_location": False 
        }

    # 4. Get Products (Only from Active Outlets)
    products = (
        db.query(Product)
        .join(ShopProduct, ShopProduct.product_id == Product.id)
        .outerjoin(DailyDeal, DailyDeal.product_id == Product.id)
        .filter(
            ShopProduct.outlet_id.in_(outlet_ids), # <--- Uses only active IDs
            ShopProduct.is_available == True,
            Product.status == True,
            Product.is_available == True
        )
        .all()
    )

    # ... (Rest of your processing logic remains the same) ...
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


@router.get("/category/{slug}")
def get_products_by_category(slug: str, zipcode: str, db: Session = Depends(get_db)):
    # 1. Get User Location
    user_lat, user_lng = get_lat_lng_from_zipcode(zipcode)
    if not user_lat:
        raise HTTPException(status_code=404, detail="Invalid zipcode")

    # 2. Find Category
    category = db.query(Category).filter(Category.slug == slug).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    # 3. Find Nearby Outlets
    nearby_outlets = get_nearby_outlets(db, user_lat, user_lng)
    
    # ✅ FILTER: Only include outlets where status is TRUE (Open)
    active_outlets = [outlet for outlet in nearby_outlets if outlet.status is True]
    outlet_ids = [outlet.id for outlet in active_outlets]

    if not outlet_ids:
        return {"category_name": category.name, "products": []}

    # 4. Fetch Products
    products = (
        db.query(Product)
        .join(ShopProduct, ShopProduct.product_id == Product.id)
        .filter(
            Product.category_id == category.id,
            ShopProduct.outlet_id.in_(outlet_ids), # <--- Uses only active IDs
            ShopProduct.is_available == True,
            Product.status == True,
            Product.is_available == True
        )
        .all()
    )

    # 5. Return JSON
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