from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any

from app.core.database import get_db
from app.models import Wishlist, Product, Zipcode, ShopProduct, Outlet
from app.services.map_service import get_lat_lng_from_zipcode, get_nearby_outlets
from app.schemas.wishlist import WishlistSyncRequest
from pydantic import BaseModel

router = APIRouter()

class GuestWishlistRequest(BaseModel):
    zipcode: Optional[str] = None
    items: List[Dict[str, Any]]

@router.get("/{user_id}")
def get_user_wishlist(user_id: int, zipcode: Optional[str] = None, db: Session = Depends(get_db)):
    products = (
        db.query(Product)
        .join(Wishlist, Wishlist.product_id == Product.id)
        .filter(Wishlist.user_id == user_id, Product.is_deleted == False)
        .all()
    )

    available_product_ids = set()
    location_provided = False

    if zipcode and zipcode != "undefined" and zipcode.strip() != "":
        location_provided = True
        zip_record = db.query(Zipcode).filter(Zipcode.zipcode == zipcode).first()
        u_lat, u_lng = None, None
        
        if zip_record and zip_record.latitude and zip_record.longitude:
            u_lat, u_lng = zip_record.latitude, zip_record.longitude
        else:
            u_lat, u_lng = get_lat_lng_from_zipcode(zipcode)
            if u_lat and u_lng:
                if zip_record:
                    zip_record.latitude = u_lat
                    zip_record.longitude = u_lng
                else:
                    db.add(Zipcode(zipcode=zipcode, latitude=u_lat, longitude=u_lng))
                db.commit()

        if u_lat and u_lng:
            nearby_outlets = get_nearby_outlets(db, u_lat, u_lng)
            outlet_ids = [o.id for o in nearby_outlets if o.status == True and o.is_deleted == False]
            if outlet_ids:
                shop_prods = db.query(ShopProduct.product_id).filter(
                    ShopProduct.outlet_id.in_(outlet_ids),
                    ShopProduct.is_available == True
                ).all()
                available_product_ids = {p[0] for p in shop_prods}

    result = []
    for p in products:
        base_available = p.status == True and p.is_available == True and p.is_deleted == False
        if location_provided:
            is_available = base_available and (p.id in available_product_ids)
        else:
            is_available = base_available

        result.append({
            "id": p.id, "name": p.name, "slug": p.slug, "price": p.price,
            "compare_price": p.compare_price, "image": p.image, "unit": p.unit,
            "is_available": is_available 
        })
    return result

@router.post("/guest")
def validate_guest_wishlist(data: GuestWishlistRequest, db: Session = Depends(get_db)):
    """ ✅ Validates local storage wishlist items for guests based on location """
    available_product_ids = set()
    location_provided = False

    if data.zipcode and data.zipcode != "undefined" and data.zipcode.strip() != "":
        location_provided = True
        zip_record = db.query(Zipcode).filter(Zipcode.zipcode == data.zipcode).first()
        u_lat, u_lng = None, None
        
        if zip_record and zip_record.latitude and zip_record.longitude:
            u_lat, u_lng = zip_record.latitude, zip_record.longitude
        else:
            u_lat, u_lng = get_lat_lng_from_zipcode(data.zipcode)
            if u_lat and u_lng:
                if not zip_record:
                    db.add(Zipcode(zipcode=data.zipcode, latitude=u_lat, longitude=u_lng))
                    db.commit()

        if u_lat and u_lng:
            nearby_outlets = get_nearby_outlets(db, u_lat, u_lng)
            outlet_ids = [o.id for o in nearby_outlets if o.status == True and o.is_deleted == False]
            if outlet_ids:
                shop_prods = db.query(ShopProduct.product_id).filter(
                    ShopProduct.outlet_id.in_(outlet_ids),
                    ShopProduct.is_available == True
                ).all()
                available_product_ids = {p[0] for p in shop_prods}

    validated_items = []
    for item in data.items:
        p_id = item.get("id")
        p = db.query(Product).filter(Product.id == p_id, Product.is_deleted == False).first()
        if not p: continue
        
        base_available = p.status == True and p.is_available == True
        is_available = (base_available and (p.id in available_product_ids)) if location_provided else base_available
        
        item["is_available"] = is_available
        validated_items.append(item)
    
    return validated_items

@router.post("/sync")
def sync_user_wishlist(payload: WishlistSyncRequest, db: Session = Depends(get_db)):
    try:
        db.query(Wishlist).filter(Wishlist.user_id == payload.user_id).delete()
        for pid in payload.product_ids:
            product_exists = db.query(Product).filter(Product.id == pid, Product.is_deleted == False).first()
            if product_exists:
                db_item = Wishlist(user_id=payload.user_id, product_id=pid)
                db.add(db_item)
        db.commit()
        return {"status": "success", "message": "Wishlist synchronized successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to sync wishlist")