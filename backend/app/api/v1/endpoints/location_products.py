from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from sqlalchemy import or_
from app.core.database import get_db
from app.models import Product, ShopProduct, DailyDeal, Category, Marquee, Banner, Outlet, Testimonial, Zipcode, SearchTrend
from app.services.map_service import get_lat_lng_from_zipcode, get_nearby_outlets

from pydantic import BaseModel

class SearchLogRequest(BaseModel):
    term: str



router = APIRouter()

# =====================================================
# HOME DATA (Marquee + Banners + Products by Location)
# =====================================================
@router.get("/")
def get_home_data(zipcode: str= None, db: Session = Depends(get_db)):

    # 1. Fetch Marquee (✅ Fetch ALL marquees instead of just the first one)
    marquees = db.query(Marquee).order_by(Marquee.created_at.desc()).all()
    if marquees:
        # Join them all together with a spacer (e.g., ' • ')    
        marquee_text = "  •  ".join([m.text for m in marquees])
    else:
        marquee_text = "Welcome to Fresh&Safe! Deliveries available in select locations."

    # 2. Fetch Banners
    banners = db.query(Banner).order_by(Banner.display_order).all()
    banner_list = [
        {"id": b.id, "image": b.image, "url": b.url}
        for b in banners
    ]

    # Fetch all active categories right away
    # ✅ SOFT DELETE FILTER APPLIED
    categories = (
        db.query(Category)
        .filter(Category.status == True, Category.is_deleted == False)
        .order_by(Category.display_order)
        .all()
    )
    category_list = [
        {"id": c.id, "name": c.name, "image": c.image, "slug": c.slug}
        for c in categories
    ]

    # Fetch Testimonials
    testimonials = (
        db.query(Testimonial)
        .filter(Testimonial.status == True)
        .order_by(Testimonial.display_order)
        .all()
    )
    testimonial_list = [
        {
            "id": t.id, 
            "name": t.name, 
            "description": t.description, 
            "photo": t.photo, 
            "place": t.place
        }
        for t in testimonials
    ]

    if not zipcode or str(zipcode).strip() == "":
        return {
            "marquee": marquee_text,
            "banners": banner_list,
            "daily_deals": [],
            "categories": category_list, 
            "products": [],
            "testimonials": testimonial_list,
            "valid_location": False
        }

    # Location Logic 
    user_lat, user_lng = None, None
    try:
        zip_record = db.query(Zipcode).filter(Zipcode.zipcode == zipcode).first()
        if zip_record and zip_record.latitude:
            user_lat, user_lng = zip_record.latitude, zip_record.longitude
        else:
            user_lat, user_lng = get_lat_lng_from_zipcode(zipcode)
            if user_lat and user_lng:
                new_zip = Zipcode(zipcode=zipcode, latitude=user_lat, longitude=user_lng)
                db.add(new_zip)
                db.commit()
    except Exception as e:
        print(f"Map service error (Home Data): {e}")

    if not user_lat:
        return {
            "marquee": marquee_text,
            "banners": banner_list,
            "daily_deals": [],
            "categories": category_list, 
            "products": [],
            "testimonials": testimonial_list,
            "valid_location": False
        }

    # Get Nearby Outlets
    nearby_outlets = get_nearby_outlets(db, user_lat, user_lng)

    # FILTER: Only include outlets where status is TRUE (Open) AND not deleted
    # ✅ SOFT DELETE FILTER APPLIED
    active_outlets = [outlet for outlet in nearby_outlets if outlet.status is True and outlet.is_deleted is False]
    outlet_ids = [outlet.id for outlet in active_outlets]

    # If no active outlets are found nearby
    if not outlet_ids:
        return {
            "marquee": marquee_text,
            "banners": banner_list,
            "daily_deals": [],
            "categories": category_list, 
            "products": [],
            "testimonials": testimonial_list, 
            "valid_location": False 
        }

    # Fetch Products
    # ✅ SOFT DELETE FILTER APPLIED
    products = (
        db.query(Product)
        .join(ShopProduct, ShopProduct.product_id == Product.id)
        .outerjoin(DailyDeal, DailyDeal.product_id == Product.id)
        .filter(
            ShopProduct.outlet_id.in_(outlet_ids),
            ShopProduct.is_available == True,
            Product.status == True,
            Product.is_available == True,
            Product.is_deleted == False
        )
        .all()
    )

    daily_deals = []
    normal_products = []
    category_ids = set()

    for product in products:
        category_ids.add(product.category_id)

        cat_name = product.category.name if product.category else "Offer"

        if product.daily_deal:
            daily_deals.append({
                "id": product.id,
                "name": product.name,
                "slug": product.slug,  
                "image": product.image,
                "price": product.price,  # Show standard MRP
                "compare_price": product.compare_price,  # ✅ ADDED THIS LINE
                "unit": product.unit,
                "category_name": cat_name
            })
        else:
            normal_products.append({
                "id": product.id,
                "name": product.name,
                "slug": product.slug,  
                "image": product.image,
                "price": product.price,  # Show standard MRP
                "compare_price": product.compare_price,  # ✅ ADDED THIS LINE
                "unit": product.unit,
                "category_name": cat_name
            })

    return {
        "marquee": marquee_text,
        "banners": banner_list,
        "daily_deals": daily_deals,
        "categories": category_list, 
        "products": normal_products[:6],
        "testimonials": testimonial_list, 
        "valid_location": True
    }


# =====================================================
# PRODUCTS BY CATEGORY (Location Aware)
# =====================================================
@router.get("/category/{slug}")
def get_products_by_category(slug: str, zipcode: str, db: Session = Depends(get_db)):
    user_lat, user_lng = None, None
    try:
        zip_record = db.query(Zipcode).filter(Zipcode.zipcode == zipcode).first()
        if zip_record and zip_record.latitude:
            user_lat, user_lng = zip_record.latitude, zip_record.longitude
        else:
            user_lat, user_lng = get_lat_lng_from_zipcode(zipcode)
    except Exception as e:
        print(f"Map service error (Category Data): {e}")

    if not user_lat:
        raise HTTPException(status_code=404, detail="Invalid zipcode or map service unavailable")

    # ✅ SOFT DELETE FILTER APPLIED
    category = db.query(Category).filter(Category.slug == slug, Category.is_deleted == False).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    nearby_outlets = get_nearby_outlets(db, user_lat, user_lng)
    
    # ✅ SOFT DELETE FILTER APPLIED
    active_outlets = [outlet for outlet in nearby_outlets if outlet.status is True and outlet.is_deleted is False]
    outlet_ids = [outlet.id for outlet in active_outlets]

    if not outlet_ids:
        return {"category_name": category.name, "products": []}

    # ✅ SOFT DELETE FILTER APPLIED
    products = (
        db.query(Product)
        .join(ShopProduct, ShopProduct.product_id == Product.id)
        .filter(
            Product.category_id == category.id,
            ShopProduct.outlet_id.in_(outlet_ids),
            ShopProduct.is_available == True,
            Product.status == True,
            Product.is_available == True,
            Product.is_deleted == False
        )
        .all()
    )

    return {
        "category_name": category.name,
        "products": [
            {
                "id": p.id,
                "name": p.name,
                "slug": p.slug, 
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
    user_lat, user_lng = None, None
    try:
        zip_record = db.query(Zipcode).filter(Zipcode.zipcode == zipcode).first()
        if zip_record and zip_record.latitude:
            user_lat, user_lng = zip_record.latitude, zip_record.longitude
        else:
            user_lat, user_lng = get_lat_lng_from_zipcode(zipcode)
    except Exception as e:
        print(f"Map service error (Product Details): {e}")

    if not user_lat:
        raise HTTPException(status_code=404, detail="Invalid zipcode or map service unavailable")

    # ✅ SOFT DELETE FILTER APPLIED
    product = (
        db.query(Product)
        .filter(
            Product.slug == slug,
            Product.status == True,
            Product.is_available == True,
            Product.is_deleted == False
        )
        .first()
    )

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    nearby_outlets = get_nearby_outlets(db, user_lat, user_lng)
    
    # ✅ SOFT DELETE FILTER APPLIED
    active_outlets = [outlet for outlet in nearby_outlets if outlet.status is True and outlet.is_deleted is False]
    outlet_ids = [outlet.id for outlet in active_outlets]

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
        "images": product.images,
        "price": product.price,                 # ✅ Always use standard MRP
        "compare_price": product.compare_price,
        "unit": product.unit,
        "category": product.category.name
    }




def log_search_term(db: Session, raw_query: str):
    clean_query = raw_query.strip().lower()
    if len(clean_query) < 3: # Ignore tiny searches
        return

    try:
        trend = db.query(SearchTrend).filter(SearchTrend.term == clean_query).first()
        if trend:
            trend.count += 1
        else:
            new_trend = SearchTrend(term=clean_query, count=1)
            db.add(new_trend)
        db.commit()
    except Exception as e:
        print(f"FAILED TO LOG SEARCH: {e}")
        db.rollback()


# =====================================================
# GLOBAL SEARCH (Categories & Location-Aware Products)
# =====================================================
@router.get("/search")
def search_items(q: str,zipcode: str = None, db: Session = Depends(get_db)):
    if not q or len(q.strip()) < 2:
        return {"categories": [], "products": []}
    
    

    search_query = f"%{q.strip()}%"

    # 1. Search Categories (Global - not dependent on location)
    # ✅ SOFT DELETE FILTER APPLIED
    categories = db.query(Category).filter(
        Category.status == True,
        Category.is_deleted == False,
        Category.name.ilike(search_query)
    ).limit(5).all()

    category_results = [
        {"name": c.name, "slug": c.slug, "image": c.image, "type": "category"} 
        for c in categories
    ]

    # 2. Search Products (Location Aware)
    product_results = []
    
    if zipcode:
        user_lat, user_lng = None, None
        try:
            zip_record = db.query(Zipcode).filter(Zipcode.zipcode == zipcode).first()
            if zip_record and zip_record.latitude:
                user_lat, user_lng = zip_record.latitude, zip_record.longitude
            else:
                user_lat, user_lng = get_lat_lng_from_zipcode(zipcode)
        except Exception:
            pass

        if user_lat and user_lng:
            nearby_outlets = get_nearby_outlets(db, user_lat, user_lng)
            # ✅ SOFT DELETE FILTER APPLIED
            active_outlets = [outlet for outlet in nearby_outlets if outlet.status is True and outlet.is_deleted is False]
            outlet_ids = [outlet.id for outlet in active_outlets]

            if outlet_ids:
                # ✅ SOFT DELETE FILTER APPLIED
                products = (
                    db.query(Product)
                    .join(ShopProduct, ShopProduct.product_id == Product.id)
                    .filter(
                        ShopProduct.outlet_id.in_(outlet_ids),
                        ShopProduct.is_available == True,
                        Product.status == True,
                        Product.is_available == True,
                        Product.is_deleted == False,
                        or_(
                            Product.name.ilike(search_query),
                            Product.description.ilike(search_query)
                        )
                    )
                    .limit(10)
                    .all()
                )

                product_results = [
                    {"name": p.name, "slug": p.slug, "image": p.image, "price": p.price, "type": "product"}
                    for p in products
                ]

    # ✅ NO MORE BACKGROUND LOGGING HERE - Kept purely for returning live typing results.
    return {
        "categories": category_results,
        "products": product_results
    }


# =====================================================
# LOG SEARCH CLICK (Fixes the "chic" problem)
# =====================================================
@router.post("/log-search")
def log_popular_search(
    req: SearchLogRequest, 
    db: Session = Depends(get_db) # ❌ REMOVED BackgroundTasks
):
    # ✅ Save instantly while the database connection is still wide open!
    log_search_term(db, req.term)
    return {"status": "logged"}


# =====================================================
# POPULAR SEARCHES
# =====================================================
@router.get("/popular-searches")
def get_popular_searches(limit: int = 5, db: Session = Depends(get_db)):
    trends = db.query(SearchTrend).order_by(desc(SearchTrend.count)).limit(limit).all()
    return [trend.term for trend in trends]