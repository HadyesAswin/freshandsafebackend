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

    # ✅ FIX 1: Merge duplicates before saving to the database
    merged_items = {}
    for item in data.items:
        if item.product_id in merged_items:
            merged_items[item.product_id] += item.quantity
        else:
            merged_items[item.product_id] = item.quantity

    # Now loop through the cleaned, merged items and save them
    for pid, qty in merged_items.items():
        product_exists = db.query(Product).filter(Product.id == pid).first()
        if product_exists:
            new_item = CartItem(
                cart_id=cart.id, 
                product_id=pid, 
                quantity=qty
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
    
    cart = db.query(Cart).options(
        joinedload(Cart.items).joinedload(CartItem.product)
    ).filter(Cart.user_id == user_id).first()
    
    if not cart: 
        return []
    
    # ✅ Changed from a set() to a dict() to hold {product_id: stock_quantity}
    available_products_stock = {} 
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
            active_outlets = [o for o in nearby_outlets if o.status == True and o.is_deleted == False]
            
            if active_outlets:
                primary_outlet = active_outlets[0]
                outlet_ids = [primary_outlet.id]
                
                # ✅ FETCH STOCK: Now we pull the actual stock amount too!
                shop_prods = db.query(ShopProduct.product_id, ShopProduct.stock).filter(
                    ShopProduct.outlet_id.in_(outlet_ids),
                    ShopProduct.is_available == True,
                    ShopProduct.stock > 0 # Must have at least 1 in stock!
                ).all()
                
                # Map it to {product_id: stock_amount}
                available_products_stock = {p[0]: p[1] for p in shop_prods} 
    
    merged_cart = {}
    
    for item in cart.items:
        if not item.product: continue
            
        global_active = (item.product.status and item.product.is_available and not item.product.is_deleted)
        
        # ✅ Determine available stock limits
        if location_provided:
            is_available = global_active and (item.product.id in available_products_stock)
            max_stock = available_products_stock.get(item.product.id, 0)
        else:
            is_available = global_active
            max_stock = 0 # Cannot buy without location

        if item.product.id in merged_cart:
            merged_cart[item.product.id]["quantity"] += item.quantity
        else:
            merged_cart[item.product.id] = {
                "id": item.product.id,
                "name": item.product.name,
                "slug": item.product.slug,
                "price": item.product.price,
                "image": item.product.image,
                "quantity": item.quantity,
                "unit": item.product.unit, 
                "is_available": is_available,
                "max_stock": max_stock # ✅ Send the live stock limit to the frontend!
            }
            
        # ✅ Auto-correct cart quantity if it exceeds max stock
        if is_available and merged_cart[item.product.id]["quantity"] > max_stock:
             merged_cart[item.product.id]["quantity"] = max_stock
    
    return list(merged_cart.values())

# ==========================================
# 3. GUEST CART VALIDATION (Location Aware)
# ==========================================
# ==========================================
# 2. GET CART (Location & Stock Aware)
# ==========================================
@router.get("/{user_id}")
def get_cart(user_id: int, zipcode: Optional[str] = None, db: Session = Depends(get_db)):
    print(f"\n🛒 ===== LOGGED-IN CART VALIDATION | User: {user_id} =====")
    
    cart = db.query(Cart).options(
        joinedload(Cart.items).joinedload(CartItem.product)
    ).filter(Cart.user_id == user_id).first()
    
    if not cart: 
        return []
    
    # ✅ Changed from a set() to a dict() to hold {product_id: stock_quantity}
    available_products_stock = {} 
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
            active_outlets = [o for o in nearby_outlets if o.status == True and o.is_deleted == False]
            
            if active_outlets:
                primary_outlet = active_outlets[0]
                outlet_ids = [primary_outlet.id]
                
                # ✅ FETCH STOCK: Now we pull the actual stock amount too!
                shop_prods = db.query(ShopProduct.product_id, ShopProduct.stock).filter(
                    ShopProduct.outlet_id.in_(outlet_ids),
                    ShopProduct.is_available == True,
                    ShopProduct.stock > 0 # Must have at least 1 in stock!
                ).all()
                
                # Map it to {product_id: stock_amount}
                available_products_stock = {p[0]: p[1] for p in shop_prods} 
    
    merged_cart = {}
    
    for item in cart.items:
        if not item.product: continue
            
        global_active = (item.product.status and item.product.is_available and not item.product.is_deleted)
        
        # ✅ Determine available stock limits
        if location_provided:
            is_available = global_active and (item.product.id in available_products_stock)
            max_stock = available_products_stock.get(item.product.id, 0)
        else:
            is_available = global_active
            max_stock = 0 # Cannot buy without location

        if item.product.id in merged_cart:
            merged_cart[item.product.id]["quantity"] += item.quantity
        else:
            merged_cart[item.product.id] = {
                "id": item.product.id,
                "name": item.product.name,
                "slug": item.product.slug,
                "price": item.product.price,
                "image": item.product.image,
                "quantity": item.quantity,
                "unit": item.product.unit, 
                "is_available": is_available,
                "max_stock": max_stock # ✅ Send the live stock limit to the frontend!
            }
            
        # ✅ Auto-correct cart quantity if it exceeds max stock
        if is_available and merged_cart[item.product.id]["quantity"] > max_stock:
             merged_cart[item.product.id]["quantity"] = max_stock
    
    return list(merged_cart.values())

# ==========================================
# 3. GUEST CART VALIDATION (Location & Stock Aware)
# ==========================================
@router.post("/guest")
def validate_guest_cart(data: GuestCartRequest, db: Session = Depends(get_db)):
    print(f"\n🛒 ===== GUEST CART VALIDATION =====")

    available_products_stock = {}
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
                if zip_record:
                    zip_record.latitude = u_lat
                    zip_record.longitude = u_lng
                else:
                    db.add(Zipcode(zipcode=data.zipcode, latitude=u_lat, longitude=u_lng))
                db.commit()

        if u_lat and u_lng:
            nearby_outlets = get_nearby_outlets(db, u_lat, u_lng)
            active_outlets = [o for o in nearby_outlets if o.status == True and o.is_deleted == False]
            
            if active_outlets:
                primary_outlet = active_outlets[0]
                outlet_ids = [primary_outlet.id]
                
                # ✅ FETCH STOCK
                shop_prods = db.query(ShopProduct.product_id, ShopProduct.stock).filter(
                    ShopProduct.outlet_id.in_(outlet_ids),
                    ShopProduct.is_available == True,
                    ShopProduct.stock > 0
                ).all()
                available_products_stock = {p[0]: p[1] for p in shop_prods}

    validated_cart = []
    for item in data.items:
        product_id = item.get("id")
        if not product_id: continue
            
        db_prod = db.query(Product).filter(Product.id == product_id).first()
        if not db_prod: continue
            
        global_active = (db_prod.status and db_prod.is_available and not db_prod.is_deleted)
        
        if location_provided:
            is_available = global_active and (db_prod.id in available_products_stock)
            max_stock = available_products_stock.get(db_prod.id, 0)
        else:
            is_available = global_active
            max_stock = 0

        item["price"] = db_prod.price
        item["is_available"] = is_available
        item["max_stock"] = max_stock # ✅ Send the live stock limit to the frontend!
        
        # ✅ Auto-correct cart quantity if it exceeds max stock
        if is_available and item.get("quantity", 1) > max_stock:
            item["quantity"] = max_stock
            
        validated_cart.append(item)
        
    return validated_cart