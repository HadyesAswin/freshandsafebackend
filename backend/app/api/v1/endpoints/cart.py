from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from app.core.database import get_db
from app.models import Cart, CartItem, Product, DailyDeal
from pydantic import BaseModel
from typing import List, Optional  # ✅ Added Optional here
import datetime

router = APIRouter()

# --- SCHEMAS ---
class CartItemSchema(BaseModel):
    product_id: int
    quantity: int

class CartSyncSchema(BaseModel):
    user_id: int
    items: List[CartItemSchema]

# ==========================================
# 1. SYNC CART (Overwrite logic)
# ==========================================
@router.post("/sync")
def sync_cart(data: CartSyncSchema, db: Session = Depends(get_db)):
    # 1. Get or Create Cart for user
    cart = db.query(Cart).filter(Cart.user_id == data.user_id).first()
    if not cart:
        cart = Cart(user_id=data.user_id)
        db.add(cart)
        db.flush()

    # 2. TOTAL SYNC: Clear existing items in the DB
    db.query(CartItem).filter(CartItem.cart_id == cart.id).delete()

    # 3. Add the current items from the frontend
    for item in data.items:
        new_item = CartItem(
            cart_id=cart.id, 
            product_id=item.product_id, 
            quantity=item.quantity
        )
        db.add(new_item)
    
    db.commit()
    return {"message": "Cart synchronized successfully"}

# ==========================================
# 2. GET CART (With Deal Awareness)
# ==========================================
@router.get("/{user_id}")
def get_cart(user_id: int, zipcode: Optional[str] = None, db: Session = Depends(get_db)):
    cart = db.query(Cart).options(
        joinedload(Cart.items).joinedload(CartItem.product)
    ).filter(Cart.user_id == user_id).first()
    
    if not cart:
        return []
    
    # 1. Fetch all active deals (Ignoring zipcode for now)
    deals = db.query(DailyDeal).all()
    # ✅ FIX: Using 'offer_price' instead of 'deal_price'
    active_deals = {d.product_id: d.offer_price for d in deals}

    cart_data = []
    for item in cart.items:
        current_price = active_deals.get(item.product_id, item.product.price)
        
        cart_data.append({
            "id": item.product.id,
            "name": item.product.name,
            "price": current_price,
            "image": item.product.image,
            "quantity": item.quantity,
            "is_deal": item.product_id in active_deals
        })
    
    return cart_data