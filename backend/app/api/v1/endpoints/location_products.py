from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Product, ShopProduct, DailyDeal, Category, Marquee, Banner
from app.services.map_service import get_lat_lng_from_zipcode, get_nearby_outlets

router = APIRouter()


# =====================================================
# HOME DATA (Marquee + Banners + Products by Location)
# =====================================================
@router.get("/")
def get_home_data(zipcode: str, db: Session = Depends(get_db)):

    # 1. Fetch Marquee
    marquee = db.query(Marquee).order_by(Marquee.created_at.desc()).first()
    marquee_text = marquee.text if marquee else "Welcome to Fresh&Safe!"

    # 2. Fetch Banners
    banners = db.query(Banner).order_by(Banner.display_order).all()
    banner_list = [
        {"id": b.id, "image": b.image, "url": b.url}
        for b in banners
    ]

    # 3. Validate Zipcode
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

    # 4. Get Nearby Outlets
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

    # 5. Fetch Products
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
                "slug": product.slug,   # ✅ Added for consistency
                "image": product.image,
                "price": product.daily_deal.offer_price,
                "original_price": product.price
            })
        else:
            normal_products.append({
                "id": product.id,
                "name": product.name,
                "slug": product.slug,   # ✅ Added for consistency
                "image": product.image,
                "price": product.price
            })

    # 6. Get Categories
    categories = (
        db.query(Category)
        .filter(Category.id.in_(category_ids), Category.status == True)
        .order_by(Category.display_order)
        .all()
    )

    category_list = [
        {"id": c.id, "name": c.name, "image": c.image, "slug": c.slug}
        for c in categories
    ]

    return {
        "marquee": marquee_text,
        "banners": banner_list,
        "daily_deals": daily_deals,
        "categories": category_list,
        "products": normal_products[:6],
        "valid_location": True
    }


# =====================================================
# PRODUCTS BY CATEGORY (Location Aware)
# =====================================================
@router.get("/category/{slug}")
def get_products_by_category(slug: str, zipcode: str, db: Session = Depends(get_db)):

    # 1. Validate Zipcode
    user_lat, user_lng = get_lat_lng_from_zipcode(zipcode)
    if not user_lat:
        raise HTTPException(status_code=404, detail="Invalid zipcode")

    # 2. Get Category
    category = db.query(Category).filter(Category.slug == slug).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    # 3. Nearby Outlets
    nearby_outlets = get_nearby_outlets(db, user_lat, user_lng)
    outlet_ids = [outlet.id for outlet in nearby_outlets]

    if not outlet_ids:
        return {"category_name": category.name, "products": []}

    # 4. Fetch Products
    products = (
        db.query(Product)
        .join(ShopProduct, ShopProduct.product_id == Product.id)
        .filter(
            Product.category_id == category.id,
            ShopProduct.outlet_id.in_(outlet_ids),
            ShopProduct.is_available == True,
            Product.status == True,
            Product.is_available == True
        )
        .all()
    )

    # 5. Return Clean JSON
    return {
        "category_name": category.name,
        "products": [
            {
                "id": p.id,
                "name": p.name,
                "slug": p.slug,   # ✅ FIXED (THIS WAS MISSING)
                "image": p.image,
                "price": p.price,
                "compare_price": p.compare_price,
                "unit": p.unit
            }
            for p in products
        ]
    }


# =====================================================
# PRODUCT DETAILS (Location Aware)
# =====================================================
@router.get("/product/{slug}")
def get_product_details(slug: str, zipcode: str, db: Session = Depends(get_db)):

    # 1. Validate Zipcode
    user_lat, user_lng = get_lat_lng_from_zipcode(zipcode)
    if not user_lat:
        raise HTTPException(status_code=404, detail="Invalid zipcode")

    # 2. Get Product
    product = (
        db.query(Product)
        .filter(
            Product.slug == slug,
            Product.status == True,
            Product.is_available == True
        )
        .first()
    )

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # 3. Check Availability in Nearby Outlets
    nearby_outlets = get_nearby_outlets(db, user_lat, user_lng)
    outlet_ids = [outlet.id for outlet in nearby_outlets]

    shop_product = (
        db.query(ShopProduct)
        .filter(
            ShopProduct.product_id == product.id,
            ShopProduct.outlet_id.in_(outlet_ids),
            ShopProduct.is_available == True
        )
        .first()
    )

    if not shop_product:
        raise HTTPException(
            status_code=404,
            detail="Product not available in your area"
        )

    # 4. Check Daily Deal
    deal = (
        db.query(DailyDeal)
        .filter(DailyDeal.product_id == product.id)
        .first()
    )

    return {
        "id": product.id,
        "name": product.name,
        "slug": product.slug,
        "description": product.description,
        "image": product.image,
        "price": deal.offer_price if deal else product.price,
        "original_price": product.price if deal else None,
        "compare_price": product.compare_price,
        "unit": product.unit,
        "category": product.category.name
    }
