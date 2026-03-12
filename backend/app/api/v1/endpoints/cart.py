from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from app.core.database import get_db
# ✅ Removed DailyDeal import
from app.models import Cart, CartItem, Product, User, ShopProduct, Zipcode
from app.services.map_service import get_lat_lng_from_zipcode, get_nearby_outlets
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import datetime

router = APIRouter()

# --- SCHEMAS ---
class CartItemSchema(BaseModel):
    product_id: int
    quantity: int

class CartSyncSchema(BaseModel):
    user_id: int
    items: List[CartItemSchema]

class GuestCartRequest(BaseModel):
    zipcode: Optional[str] = None
    items: List[Dict[str, Any]]

# ==========================================
# 1. SYNC CART (With User Existence Check)
# ==========================================
@router.post("/sync")
def sync_cart(data: CartSyncSchema, db: Session = Depends(get_db)):
    user_exists = db.query(User).filter(User.id == data.user_id).first()
    if not user_exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="User not found. Session might be stale. Please log out and log in again."
        )

    cart = db.query(Cart).filter(Cart.user_id == data.user_id).first()
    
    if not cart:
        cart = Cart(user_id=data.user_id)
        db.add(cart)
        db.commit()
        db.refresh(cart)

    db.query(CartItem).filter(CartItem.cart_id == cart.id).delete(synchronize_session=False)

    for item in data.items:
        product_exists = db.query(Product).filter(Product.id == item.product_id).first()
        if product_exists:
            new_item = CartItem(
                cart_id=cart.id, 
                product_id=item.product_id, 
                quantity=item.quantity
            )
            db.add(new_item)
    
    db.commit()
    return {"message": "Cart synchronized successfully"}

# ==========================================
# 2. GET CART (Location Aware)
# ==========================================
@router.get("/{user_id}")
def get_cart(user_id: int, zipcode: Optional[str] = None, db: Session = Depends(get_db)):
    print(f"\n🛒 ===== LOGGED-IN CART VALIDATION | User: {user_id} =====")
    print(f"📬 Received Zipcode: '{zipcode}'")

    cart = db.query(Cart).options(
        joinedload(Cart.items).joinedload(CartItem.product)
    ).filter(Cart.user_id == user_id).first()
    
    if not cart: 
        print("📭 User has no cart in DB.")
        return []
    
    available_product_ids = set()
    location_provided = False 

    if zipcode and zipcode != "undefined" and zipcode.strip() != "":
        location_provided = True 
        
        print(f"🔍 DB Lookup for Zipcode '{zipcode}' coordinates...")
        zip_record = db.query(Zipcode).filter(Zipcode.zipcode == zipcode).first()
        u_lat, u_lng = None, None
        
        if zip_record and zip_record.latitude and zip_record.longitude:
            u_lat, u_lng = zip_record.latitude, zip_record.longitude
            print(f"✅ Found coordinates in DB! Lat: {u_lat}, Lng: {u_lng}")
        else:
            print(f"⚠️ Coordinates missing in DB. Calling map_service...")
            u_lat, u_lng = get_lat_lng_from_zipcode(zipcode)
            if u_lat and u_lng:
                print(f"🌍 Nominatim API Success: Lat: {u_lat}, Lng: {u_lng}")
                if zip_record:
                    zip_record.latitude = u_lat
                    zip_record.longitude = u_lng
                else:
                    db.add(Zipcode(zipcode=zipcode, latitude=u_lat, longitude=u_lng))
                db.commit()
            else:
                print("❌ Nominatim API failed to find coordinates.")

        if u_lat and u_lng:
            print(f"🏪 Searching for nearby outlets within 15km of Lat: {u_lat}, Lng: {u_lng}...")
            nearby_outlets = get_nearby_outlets(db, u_lat, u_lng)
            outlet_ids = [o.id for o in nearby_outlets if o.status == True and o.is_deleted == False]
            print(f"🎯 Active Nearby Outlet IDs found: {outlet_ids}")

            if outlet_ids:
                shop_prods = db.query(ShopProduct.product_id).filter(
                    ShopProduct.outlet_id.in_(outlet_ids),
                    ShopProduct.is_available == True
                ).all()
                available_product_ids = {p[0] for p in shop_prods}
                print(f"📦 Total unique available products in these outlets: {len(available_product_ids)}")
            else:
                print("❌ NO active outlets found within radius.")
        else:
            print("❌ NO coordinates could be resolved. Items will be marked unavailable.")
    else:
        print("ℹ️ No zipcode provided. Fetching global cart view.")
    
    cart_data = []
    for item in cart.items:
        if not item.product: continue
            
        global_active = (item.product.status and item.product.is_available and not item.product.is_deleted)
        
        if location_provided:
            is_available = global_active and (item.product.id in available_product_ids)
        else:
            is_available = global_active

        print(f"   -> Eval Item: [{item.product.id}] {item.product.name} | Global Active: {global_active} | Is Available Here: {is_available}")

        cart_data.append({
            "id": item.product.id,
            "name": item.product.name,
            "slug": item.product.slug,
            # ✅ Removed deal check, always use standard price
            "price": item.product.price,
            "image": item.product.image,
            "quantity": item.quantity,
            "unit": item.product.unit, 
            "is_available": is_available 
        })
    
    print(f"🛒 ===== CART PROCESSING COMPLETE =====\n")
    return cart_data

# ==========================================
# 3. GUEST CART VALIDATION (Location Aware)
# ==========================================
@router.post("/guest")
def validate_guest_cart(data: GuestCartRequest, db: Session = Depends(get_db)):
    print(f"\n🛒 ===== GUEST CART VALIDATION =====")
    print(f"📬 Received Zipcode: '{data.zipcode}' | Items: {len(data.items)}")

    available_product_ids = set()
    location_provided = False 

    if data.zipcode and data.zipcode != "undefined" and data.zipcode.strip() != "":
        location_provided = True 
        print(f"🔍 DB Lookup for Zipcode '{data.zipcode}' coordinates...")
        
        zip_record = db.query(Zipcode).filter(Zipcode.zipcode == data.zipcode).first()
        u_lat, u_lng = None, None
        
        if zip_record and zip_record.latitude and zip_record.longitude:
            u_lat, u_lng = zip_record.latitude, zip_record.longitude
            print(f"✅ Found coordinates in DB! Lat: {u_lat}, Lng: {u_lng}")
        else:
            print(f"⚠️ Coordinates missing in DB. Calling map_service...")
            u_lat, u_lng = get_lat_lng_from_zipcode(data.zipcode)
            if u_lat and u_lng:
                print(f"🌍 Nominatim API Success: Lat: {u_lat}, Lng: {u_lng}")
                if zip_record:
                    zip_record.latitude = u_lat
                    zip_record.longitude = u_lng
                else:
                    db.add(Zipcode(zipcode=data.zipcode, latitude=u_lat, longitude=u_lng))
                db.commit()
            else:
                print("❌ Nominatim API failed to find coordinates.")

        if u_lat and u_lng:
            print(f"🏪 Searching for nearby outlets within 15km of Lat: {u_lat}, Lng: {u_lng}...")
            nearby_outlets = get_nearby_outlets(db, u_lat, u_lng)
            outlet_ids = [o.id for o in nearby_outlets if o.status == True and o.is_deleted == False]
            print(f"🎯 Active Nearby Outlet IDs found: {outlet_ids}")

            if outlet_ids:
                shop_prods = db.query(ShopProduct.product_id).filter(
                    ShopProduct.outlet_id.in_(outlet_ids),
                    ShopProduct.is_available == True
                ).all()
                available_product_ids = {p[0] for p in shop_prods}
                print(f"📦 Total unique available products in these outlets: {len(available_product_ids)}")
            else:
                print("❌ NO active outlets found within radius.")
        else:
            print("❌ NO coordinates could be resolved. Items will be marked unavailable.")
    else:
        print("ℹ️ No zipcode provided. Fetching global cart view.")

    validated_cart = []
    for item in data.items:
        product_id = item.get("id")
        if not product_id: continue
            
        db_prod = db.query(Product).filter(Product.id == product_id).first()
        if not db_prod: continue
            
        global_active = (db_prod.status and db_prod.is_available and not db_prod.is_deleted)
        
        if location_provided:
            is_available = global_active and (db_prod.id in available_product_ids)
        else:
            is_available = global_active

        print(f"   -> Eval Item: [{db_prod.id}] {db_prod.name} | Global Active: {global_active} | Is Available Here: {is_available}")

        # ✅ Removed deal check, always use standard price
        item["price"] = db_prod.price
        item["is_available"] = is_available
        validated_cart.append(item)
        
    print("🛒 ===== GUEST CART VALIDATION COMPLETE =====\n")
    return validated_cart