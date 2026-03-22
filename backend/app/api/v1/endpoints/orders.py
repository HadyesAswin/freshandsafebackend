from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_ # ✅ Added for filtering unpaid orders
from app.core.database import get_db
from app.core.config import settings # ✅ Import settings for Razorpay Keys
# ✅ Added ShopProduct to models
from app.models import Order, OrderItem, Product, OrderStatus, PaymentStatus, UserAddress, Outlet, Coupon, CouponUsage, Cart, CartItem, Zipcode, ShopProduct
from app.schemas.order import OrderCreate, OrderResponse, AddressUpdate, DeliveryFeeRequest, PaymentVerification # ✅ Added PaymentVerification
from app.services.qwqer_service import QwqerService
# ✅ Added map services to imports
from app.services.map_service import get_lat_lng_from_zipcode, get_nearby_outlets

import uuid
import datetime
import razorpay # ✅ Import Razorpay
import json # ✅ Added for Webhook Parsing
import hmac # ✅ Added for Webhook Security
import hashlib # ✅ Added for Webhook Security

router = APIRouter()
qwqer_api = QwqerService()

# ✅ INITIALIZE RAZORPAY CLIENT
razorpay_client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

def generate_order_number():
    date_str = datetime.datetime.now().strftime("%Y%m%d")
    short_uuid = str(uuid.uuid4())[:6].upper()
    return f"ORD-{date_str}-{short_uuid}"

# ==========================================
# 1. CREATE ORDER (Now with Security Patches)
# ==========================================
@router.post("/checkout", response_model=OrderResponse)
def create_order(order_data: OrderCreate, db: Session = Depends(get_db)):
    
    # 🛑 SECURITY PATCH 1: PREVENT PRICE SPOOFING
    # Ignore frontend prices. Fetch authentic prices from database.
    product_ids = [item.product_id for item in order_data.items]
    products = db.query(Product).filter(Product.id.in_(product_ids)).all()
    product_map = {p.id: p for p in products}

    calculated_subtotal = 0.0
    
    # ✅ DYNAMIC WEIGHT CALCULATION (Fixing Profit Leak)
    calculated_weight = 0.0

    for item in order_data.items:
        prod = product_map.get(item.product_id)
        if not prod:
            raise HTTPException(status_code=400, detail=f"Product unavailable: ID {item.product_id}")
        
        # Override the frontend price with the real database price
        item.price_per_unit = prod.price 
        calculated_subtotal += (prod.price * item.quantity)
        
        # Calculate precise cart weight for Qwqer
        if prod.unit:
            unit_str = prod.unit.lower()
            try:
                import re
                match = re.search(r"(\d+(\.\d+)?)", unit_str)
                unit_val = float(match.group(1)) if match else 1.0
                
                if "kg" in unit_str:
                    calculated_weight += (unit_val * item.quantity)
                elif "g" in unit_str and "k" not in unit_str:
                    calculated_weight += ((unit_val / 1000) * item.quantity)
                else:
                    calculated_weight += (0.5 * item.quantity) # Fallback
            except:
                calculated_weight += (0.5 * item.quantity)
        else:
            calculated_weight += (0.5 * item.quantity)

    # Ensure minimum Qwqer weight of 1.0 kg
    if calculated_weight < 1.0:
        calculated_weight = 1.0

    tax_amount = 0.0
    discount_amount = 0.0 
    applied_coupon = None

    if order_data.coupon_code:
        # ✅ SOFT DELETE FILTER APPLIED: Don't allow deleted coupons to be used
        applied_coupon = db.query(Coupon).filter(
            Coupon.code == order_data.coupon_code,
            Coupon.status == True,
            Coupon.is_deleted == False
        ).first()

        if applied_coupon and calculated_subtotal >= applied_coupon.min_order_amount:
            eligible_amount = 0.0
            if applied_coupon.applicable_type == "all":
                eligible_amount = calculated_subtotal
            else:
                for item in order_data.items:
                    prod = product_map.get(item.product_id)
                    if prod:
                        line_total = item.price_per_unit * item.quantity
                        if applied_coupon.applicable_type == "category":
                            cat_ids = [c.category_id for c in applied_coupon.categories]
                            if prod.category_id in cat_ids:
                                eligible_amount += line_total
                        elif applied_coupon.applicable_type == "product":
                            prod_ids = [p.product_id for p in applied_coupon.products]
                            if prod.id in prod_ids:
                                eligible_amount += line_total

            if eligible_amount > 0:
                if applied_coupon.discount_type == "percentage":
                    discount_amount = (eligible_amount * applied_coupon.discount_value) / 100
                    if applied_coupon.max_discount_amount:
                        discount_amount = min(discount_amount, applied_coupon.max_discount_amount)
                elif applied_coupon.discount_type == "fixed":
                    discount_amount = min(applied_coupon.discount_value, eligible_amount)


    # Smart Location Logic
    delivery_lat = order_data.delivery_latitude
    delivery_lng = order_data.delivery_longitude

    if not delivery_lat or not delivery_lng:
        zip_record = db.query(Zipcode).filter(Zipcode.zipcode == order_data.delivery_zipcode).first()
        if zip_record and zip_record.latitude:
            delivery_lat = zip_record.latitude
            delivery_lng = zip_record.longitude
        else:
            # Fallback to map service if not in Zipcode table
            delivery_lat, delivery_lng = get_lat_lng_from_zipcode(order_data.delivery_zipcode)

    # =========================================================
    # ✅ BUGFIX: FORCE CORRECT OUTLET SELECTION
    # =========================================================
    if not delivery_lat:
        raise HTTPException(status_code=400, detail="Could not resolve delivery location coordinates.")

    # Find outlets serving this location
    nearby_outlets = get_nearby_outlets(db, delivery_lat, delivery_lng)
    active_outlets = [o for o in nearby_outlets if o.status == True and o.is_deleted == False]

    if not active_outlets:
        raise HTTPException(status_code=400, detail="No active outlets serve your selected location.")

    # Check inventory for all items in the order
    product_ids_requested = [item.product_id for item in order_data.items]
    final_assigned_outlet_id = None

    for outlet in active_outlets:
        available_prods = db.query(ShopProduct.product_id).filter(
            ShopProduct.outlet_id == outlet.id,
            ShopProduct.product_id.in_(product_ids_requested),
            ShopProduct.is_available == True
        ).all()
        
        available_ids = {p[0] for p in available_prods}
        
        # Ensure the outlet has EVERY item requested
        if all(pid in available_ids for pid in product_ids_requested):
            final_assigned_outlet_id = outlet.id
            break

    if not final_assigned_outlet_id:
        raise HTTPException(status_code=400, detail="Some items in your cart are currently unavailable in your area.")
    # =========================================================

    # 🛑 SECURITY PATCH 2: PREVENT DELIVERY FEE SPOOFING
    # Never trust the frontend delivery fee. Recalculate it instantly before checkout.
    secure_delivery_fee = 0.0
    if calculated_subtotal <= 500: # Free delivery above 500
        assigned_outlet_obj = db.query(Outlet).filter(Outlet.id == final_assigned_outlet_id).first()
        temp_order = Order(
            delivery_latitude=delivery_lat, 
            delivery_longitude=delivery_lng, 
            delivery_zipcode=order_data.delivery_zipcode
        )
        
        # ✅ FIX: Use the mathematically calculated weight
        price_data = qwqer_api.calculate_price(assigned_outlet_obj, temp_order, weight=round(calculated_weight, 2))
        
        if price_data:
            fee = price_data.get("amount") if "amount" in price_data else price_data.get("delivery_amount")
            if fee is not None:
                secure_delivery_fee = float(fee)
            else:
                raise HTTPException(status_code=400, detail="Unable to verify secure delivery fee.")
        else:
            raise HTTPException(status_code=400, detail="Logistics routing failed for this location.")

    # Calculate mathematically secure final total
    final_total = calculated_subtotal + tax_amount + secure_delivery_fee - discount_amount

    # Auto-save address
    if order_data.user_id:
        existing_address = db.query(UserAddress).filter(
            UserAddress.user_id == order_data.user_id,
            UserAddress.address_line1 == order_data.delivery_address_line1,
            UserAddress.zipcode == order_data.delivery_zipcode
        ).first()

        if not existing_address:
            new_address = UserAddress(
                user_id=order_data.user_id,
                name=order_data.delivery_name,
                phone=order_data.delivery_phone,
                email=order_data.customer_email,
                address_line1=order_data.delivery_address_line1,
                address_line2=order_data.delivery_address_line2,
                city=order_data.delivery_city,
                state=order_data.delivery_state,
                zipcode=order_data.delivery_zipcode,
                latitude=delivery_lat,  
                longitude=delivery_lng  
            )
            db.add(new_address)

    # 🛑 SECURITY PATCH 3: RAZORPAY FLOAT & ZERO CHECK
    razorpay_order_id = None
    if order_data.payment_method.lower() == "online":
        # Use round() to prevent python floating point errors (e.g., 3998.999999 paisa)
        amount_in_paise = int(round(final_total * 100)) 
        
        if amount_in_paise < 100:
            raise HTTPException(status_code=400, detail="Order total must be at least ₹1.00 to process online.")
            
        rzp_order_data = {
            "amount": amount_in_paise,
            "currency": "INR",
            "receipt": generate_order_number(),
            "payment_capture": 1 # Auto capture
        }
        try:
            rzp_order = razorpay_client.order.create(data=rzp_order_data)
            razorpay_order_id = rzp_order['id']
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to connect to payment gateway: {str(e)}")

    # Create Order
    new_order = Order(
        order_number=generate_order_number(),
        user_id=order_data.user_id,
        outlet_id=final_assigned_outlet_id, # ✅ Use resolved outlet ID
        customer_name=order_data.customer_name,
        customer_phone=order_data.customer_phone,
        customer_email=order_data.customer_email,
        delivery_name=order_data.delivery_name,
        delivery_phone=order_data.delivery_phone,
        delivery_address_line1=order_data.delivery_address_line1,
        delivery_address_line2=order_data.delivery_address_line2,
        delivery_city=order_data.delivery_city,
        delivery_state=order_data.delivery_state,
        delivery_zipcode=order_data.delivery_zipcode,
        delivery_latitude=delivery_lat,
        delivery_longitude=delivery_lng,
        delivery_house_number=order_data.delivery_address_line1[:20],
        
        subtotal=calculated_subtotal,
        tax_amount=tax_amount,
        delivery_fee=secure_delivery_fee, # ✅ Save the authentic verified fee
        discount_amount=discount_amount,
        total_amount=final_total,
        payment_method=order_data.payment_method,
        coupon_code=order_data.coupon_code,
        customer_note=order_data.customer_note,
        
        # ✅ SET TO PENDING! They haven't paid yet!
        order_status=OrderStatus.PENDING, 
        payment_status=PaymentStatus.PENDING,
        razorpay_order_id=razorpay_order_id # Save RZP ID to database
    )

    db.add(new_order)
    db.flush() 

    # ✅ NO COUPON LOGIC HERE ANYMORE! Moved to verify_payment

    for item in order_data.items:
        db_item = OrderItem(
            order_id=new_order.id,
            product_id=item.product_id,
            quantity=item.quantity,
            price_per_unit=item.price_per_unit, # ✅ Secured backend price
            total_price=(item.price_per_unit * item.quantity)
        )
        db.add(db_item)

    if order_data.user_id:
        user_cart = db.query(Cart).filter(Cart.user_id == order_data.user_id).first()
        if user_cart:
            db.query(CartItem).filter(CartItem.cart_id == user_cart.id).delete()

    db.commit()
    db.refresh(new_order)

    # ✅ SEND RAZORPAY DETAILS TO FRONTEND
    return {
        "id": new_order.id,
        "order_number": new_order.order_number,
        "total_amount": new_order.total_amount,
        "status": "success",
        "razorpay_order_id": new_order.razorpay_order_id,
        "razorpay_key": settings.RAZORPAY_KEY_ID # Send public key to frontend
    }


# ==========================================
# 1.5 VERIFY PAYMENT (Called by Frontend after success)
# ==========================================
@router.post("/verify-payment")
def verify_payment(payment_data: PaymentVerification, db: Session = Depends(get_db)):
    """Verifies the Razorpay signature to prevent fraud"""
    try:
        # Ask Razorpay library to verify the math
        razorpay_client.utility.verify_payment_signature({
            'razorpay_order_id': payment_data.razorpay_order_id,
            'razorpay_payment_id': payment_data.razorpay_payment_id,
            'razorpay_signature': payment_data.razorpay_signature
        })
        
        # If the code reaches here, the signature is valid! Update the DB.
        order = db.query(Order).filter(Order.razorpay_order_id == payment_data.razorpay_order_id).first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

        order.payment_status = PaymentStatus.PAID
        order.order_status = OrderStatus.CONFIRMED # Officially confirmed!
        order.razorpay_payment_id = payment_data.razorpay_payment_id
        order.razorpay_signature = payment_data.razorpay_signature
        
        # =========================================================
        # ✅ BUGFIX: Deduct the coupon ONLY when payment is successfully verified!
        # =========================================================
        if order.coupon_code and order.discount_amount > 0:
            applied_coupon = db.query(Coupon).filter(Coupon.code == order.coupon_code).first()
            if applied_coupon:
                applied_coupon.used_count += 1
                if order.user_id:
                    usage_record = CouponUsage(
                        coupon_id=applied_coupon.id,
                        user_id=order.user_id,
                        order_id=order.id,
                        discount_amount=order.discount_amount
                    )
                    db.add(usage_record)
        # =========================================================

        db.commit()
        return {"status": "success", "message": "Payment verified successfully", "order_number": order.order_number}

    except razorpay.errors.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid Payment Signature. Fraud detected.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==========================================
# 2. GET USER'S ORDER HISTORY
# ==========================================
@router.get("/my-orders/{user_id}")
def get_user_orders(user_id: int, db: Session = Depends(get_db)):
    # ✅ BUGFIX: Filter out orders that are ONLINE but not yet PAID.
    # This ensures that abandoned "ghost" orders don't appear in the user's history.
    orders = db.query(Order).filter(
        Order.user_id == user_id,
        or_(
            Order.payment_status == PaymentStatus.PAID,
            Order.order_status != OrderStatus.PENDING
        )
    ).order_by(Order.created_at.desc()).all()
    
    return [
        {
            "id": order.id,
            "order_number": order.order_number,
            "date": order.created_at.strftime("%Y-%m-%d"),
            "total_amount": order.total_amount,
            "status": order.order_status,
            "items_count": len(order.order_items),
            "first_item_name": order.order_items[0].product.name if order.order_items else None
        }
        for order in orders
    ]

# ==========================================
# 3. GET USER'S SAVED ADDRESSES
# ==========================================
@router.get("/my-addresses/{user_id}")
def get_user_addresses(user_id: int, db: Session = Depends(get_db)):
    addresses = db.query(UserAddress).filter(UserAddress.user_id == user_id).order_by(UserAddress.created_at.desc()).all()
    return addresses

# ==========================================
# 4. GET FULL ORDER DETAILS
# ==========================================
@router.get("/details/{order_number}")
def get_order_details(order_number: str, db: Session = Depends(get_db)):
    order = db.query(Order).options(
        joinedload(Order.order_items).joinedload(OrderItem.product)
    ).filter(Order.order_number == order_number).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    return {
        "order_number": order.order_number,
        "date": order.created_at.strftime("%B %d, %Y - %I:%M %p"),
        "status": order.order_status,
        "payment_method": order.payment_method,
        "customer_note": order.customer_note, # ✅ ADDED THIS LINE
        "shipping_address": {
            "name": order.delivery_name,
            "phone": order.delivery_phone,
            "line1": order.delivery_address_line1,
            "line2": order.delivery_address_line2,
            "city": order.delivery_city,
            "state": order.delivery_state,
            "zipcode": order.delivery_zipcode,
        },
        "totals": {
            "subtotal": order.subtotal,
            "delivery_fee": order.delivery_fee,
            "discount": order.discount_amount,
            "total": order.total_amount
        },
        "items": [
            {
                "id": item.id,
                "name": item.product.name,
                "image": item.product.image,
                "price": item.price_per_unit,
                "quantity": item.quantity,
                "subtotal": item.total_price,
                "unit": item.product.unit # ✅ THIS WAS MISSING!
            } for item in order.order_items
        ]
    }

# ==========================================
# 5. UPDATE SAVED ADDRESS
# ==========================================
@router.put("/addresses/{address_id}")
def update_user_address(address_id: int, addr_data: AddressUpdate, db: Session = Depends(get_db)):
    address = db.query(UserAddress).filter(UserAddress.id == address_id).first()
    if not address:
        raise HTTPException(status_code=404, detail="Address not found")
        
    address.name = addr_data.name
    address.phone = addr_data.phone
    address.email = addr_data.email
    address.address_line1 = addr_data.address_line1
    address.address_line2 = addr_data.address_line2
    address.city = addr_data.city
    address.state = addr_data.state
    address.zipcode = addr_data.zipcode
    
    address.latitude = addr_data.latitude
    address.longitude = addr_data.longitude
    
    db.commit()
    return {"message": "Address updated successfully"}


# ==========================================
# 5.6 CREATE NEW ADDRESS (Fixed mapping)
# ==========================================
@router.post("/addresses")
def create_user_address(addr_data: AddressUpdate, db: Session = Depends(get_db)):
    """
    Creates a new address. 
    """
    if not addr_data.user_id:
        raise HTTPException(status_code=400, detail="User ID is required to save an address")

    new_address = UserAddress(
        user_id=addr_data.user_id, # ✅ This will now work!
        name=addr_data.name,
        phone=addr_data.phone,
        email=addr_data.email,
        address_line1=addr_data.address_line1,
        address_line2=addr_data.address_line2,
        city=addr_data.city,
        state=addr_data.state,
        zipcode=addr_data.zipcode,
        latitude=addr_data.latitude,
        longitude=addr_data.longitude
    )
    
    try:
        db.add(new_address)
        db.commit()
        db.refresh(new_address)
        return {"message": "Address saved successfully", "id": new_address.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ==========================================
# 5.5 DELETE SAVED ADDRESS
# ==========================================
@router.delete("/addresses/{address_id}")
def delete_user_address(address_id: int, db: Session = Depends(get_db)):
    address = db.query(UserAddress).filter(UserAddress.id == address_id).first()
    if not address:
        raise HTTPException(status_code=404, detail="Address not found")
        
    db.delete(address)
    db.commit()
    return {"message": "Address deleted successfully"}    

# ==========================================
# 6. QWQER LOGISTICS: DISPATCH ORDER
# ==========================================
@router.post("/{order_id}/dispatch")
def dispatch_order_to_qwqer(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    if order.qwqer_order_id:
        raise HTTPException(status_code=400, detail="Order already dispatched to QWQER")

    outlet = db.query(Outlet).filter(Outlet.id == order.outlet_id).first()

    if not outlet.latitude or not outlet.longitude:
        raise HTTPException(status_code=400, detail="Outlet GPS coordinates are missing in the database.")
        
    if not order.delivery_latitude or not order.delivery_longitude:
        raise HTTPException(status_code=400, detail="Customer GPS coordinates are missing.")

    qwqer_response = qwqer_api.create_delivery_order(outlet, order)

    if qwqer_response.get("is_success") == True:
        data = qwqer_response["data"]
        order.qwqer_order_id = data.get("order_key")
        order.qwqer_status = "Accepted"
        
        # ✅ FIX: Change this to READY_FOR_PICKUP to represent waiting for rider
        order.order_status = OrderStatus.PREPARING 
        
        order.qwqer_assigned_at = datetime.datetime.utcnow()
        
        db.commit()
        db.refresh(order)
        
        return {"message": "Delivery dispatched successfully", "qwqer_details": data}
    else:
        raise HTTPException(status_code=400, detail=f"QWQER Integration failed: {qwqer_response.get('error') or qwqer_response}")

# ==========================================
# 7. QWQER LOGISTICS: TRACK ORDER
# ==========================================
@router.get("/{order_id}/track")
def get_qwqer_tracking(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order or not order.qwqer_order_id:
        raise HTTPException(status_code=404, detail="No QWQER delivery assigned")

    tracking_data = qwqer_api.track_order(order.qwqer_order_id)
    
    if tracking_data.get("is_success") is True and tracking_data.get("data"):
        raw_status = tracking_data["data"].get("status", "")
        safe_status = raw_status.upper().strip()
        
        order.qwqer_status = raw_status
        
        # ✅ ADDED: Tell the database how to handle "PICKED UP" and "ACCEPTED"
        if safe_status == "ACCEPTED":
            order.order_status = OrderStatus.PREPARING
        elif safe_status == "PICKED UP":
            order.order_status = OrderStatus.OUT_FOR_DELIVERY
        elif safe_status == "DELIVERED":
            order.order_status = OrderStatus.DELIVERED
            if not order.delivered_at:
                order.delivered_at = datetime.datetime.utcnow()
        elif safe_status in ["CANCELLED", "CANCELED", "RETURNED", "UNDELIVERED", "RETURNED TO WAREHOUSE", "RETURNED TO SENDER", "RETURNED TO ANOTHER ADDRESS"]:
            order.order_status = OrderStatus.CANCELLED
        
        db.commit()

    return tracking_data

# ==========================================
# 8. QWQER LOGISTICS: CANCEL DELIVERY
# ==========================================
@router.post("/{order_id}/cancel-delivery")
def cancel_qwqer_delivery(order_id: int, reason_code: int = 1, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order or not order.qwqer_order_id:
        raise HTTPException(status_code=404, detail="No QWQER delivery assigned")

    cancel_response = qwqer_api.cancel_order(order.qwqer_order_id, reason_code=reason_code)
    
    if cancel_response.get("is_success") == True:
        order.qwqer_status = "Cancelled"
        order.order_status = OrderStatus.CANCELLED
        db.commit()
        return {"message": "Delivery cancelled successfully"}
    
    raise HTTPException(status_code=400, detail="Failed to cancel delivery in QWQER")


# ==========================================
# GET DYNAMIC DELIVERY FEE FROM QWQER
# ==========================================
@router.post("/calculate-delivery-fee")
def calculate_delivery_fee(req: DeliveryFeeRequest, db: Session = Depends(get_db)):
    lat = req.delivery_latitude
    lng = req.delivery_longitude

    if not lat or not lng:
        zip_record = db.query(Zipcode).filter(Zipcode.zipcode == req.delivery_zipcode).first()
        if zip_record:
            lat = zip_record.latitude
            lng = zip_record.longitude
        else:
            lat, lng = get_lat_lng_from_zipcode(req.delivery_zipcode)

    if not lat or not lng:
        # ✅ NO 50 FALLBACK. THROW ERROR.
        raise HTTPException(status_code=400, detail="GPS Coordinates missing. Please set your location on the map.")

    # Resolve correct outlet based on geography
    nearby_outlets = get_nearby_outlets(db, lat, lng)
    active_outlets = [o for o in nearby_outlets if o.status == True and o.is_deleted == False]
    
    if active_outlets:
        outlet = active_outlets[0] # Closest one
    else:
        outlet = db.query(Outlet).filter(Outlet.id == req.outlet_id).first()

    if not outlet:
        raise HTTPException(status_code=404, detail="Outlet not found")

    temp_order = Order(
        delivery_latitude=lat, 
        delivery_longitude=lng, 
        delivery_zipcode=req.delivery_zipcode
    )

    price_data = qwqer_api.calculate_price(outlet, temp_order, weight=req.weight)

    # ✅ BUGFIX: Check for the correct key name and ensure we throw an error if Qwqer fails.
    if price_data:
        fee = price_data.get("amount") if "amount" in price_data else price_data.get("delivery_amount")
        if fee is not None:
            return {
                "delivery_fee": float(fee), 
                "distance": price_data.get("distance", 0),
                "message": "Calculated via QWQER"
            }
    
    # ✅ NO 50 FALLBACK. THROW ERROR.
    raise HTTPException(status_code=400, detail="Delivery price calculation failed. Distance may be too far or system is down.")


# ==========================================
# 9. QWQER LOGISTICS: WEBHOOK RECEIVER
# ==========================================
@router.post("/qwqer-webhook")
async def qwqer_webhook(request: Request, db: Session = Depends(get_db)):
    try:
        payload = await request.json()
        order_key = payload.get("order_key")
        
        if not order_key:
            return {"status": "ignored", "reason": "No order_key found in payload"}
            
        order = db.query(Order).filter(Order.qwqer_order_id == str(order_key)).first()
        if not order:
            return {"status": "ignored", "reason": f"Order {order_key} not found in system"}

        tracking_data = qwqer_api.track_order(order_key)
        
        if tracking_data.get("is_success") is True and tracking_data.get("data"):
            raw_qwqer_status = tracking_data["data"].get("status", "")
            order.qwqer_status = raw_qwqer_status
            safe_status = raw_qwqer_status.upper().strip()
            
            if safe_status == "ACCEPTED":
                order.order_status = OrderStatus.PREPARING 
            elif safe_status == "PICKED UP":
                order.order_status = OrderStatus.OUT_FOR_DELIVERY
            elif safe_status == "DELIVERED":
                order.order_status = OrderStatus.DELIVERED
                if not order.delivered_at:
                    order.delivered_at = datetime.datetime.utcnow()
            elif safe_status in ["CANCELLED", "CANCELED", "RETURNED", "UNDELIVERED", "RETURNED TO WAREHOUSE", "RETURNED TO SENDER", "RETURNED TO ANOTHER ADDRESS"]:
                order.order_status = OrderStatus.CANCELLED

            db.commit()
            return {"status": "success", "mapped_status": order.order_status}
            
        return {"status": "failed", "reason": "Could not verify tracking data"}

    except Exception as e:
        print(f"WEBHOOK ERROR: {str(e)}") 
        return {"status": "error", "message": str(e)}

# ==========================================
# 10. RAZORPAY SERVER-TO-SERVER WEBHOOK 
# ==========================================
@router.post("/razorpay-webhook")
async def razorpay_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Listens for Razorpay's background server pings. 
    Secures the 'Closed Tab' issue where a user pays but doesn't wait for the confirmation page.
    """
    try:
        # Get the signature from the headers
        webhook_signature = request.headers.get("X-Razorpay-Signature")
        if not webhook_signature:
            raise HTTPException(status_code=400, detail="Missing Signature")

        # Get the raw body
        payload = await request.body()
        
        # Verify that this request actually came from Razorpay using your secret key
        expected_signature = hmac.new(
            key=settings.RAZORPAY_WEBHOOK_SECRET.encode('utf-8'), # ✅ IMPORTANT: Add RAZORPAY_WEBHOOK_SECRET to your .env file
            msg=payload,
            digestmod=hashlib.sha256
        ).hexdigest()

        if not hmac.compare_digest(expected_signature, webhook_signature):
            raise HTTPException(status_code=400, detail="Invalid Signature. Hacker attempt blocked.")

        data = json.loads(payload.decode('utf-8'))
        
        # We only care about successful payments
        if data.get("event") == "payment.captured" or data.get("event") == "order.paid":
            # Safely extract order ID, depending on the exact event structure
            try:
                if "order" in data["payload"]:
                    razorpay_order_id = data["payload"]["order"]["entity"]["id"]
                else:
                    razorpay_order_id = data["payload"]["payment"]["entity"]["order_id"]
            except KeyError:
                return {"status": "ignored", "reason": "Could not find order ID in payload"}

            # Find the order in our database
            order = db.query(Order).filter(Order.razorpay_order_id == razorpay_order_id).first()
            if not order:
                return {"status": "ignored", "reason": "Order not found in our database"}

            # If it's already marked paid (frontend beat the webhook), do nothing.
            if order.payment_status == PaymentStatus.PAID:
                return {"status": "success", "message": "Order already marked as paid."}

            # ✅ THE FIX: Mark order as paid because Razorpay confirmed it!
            order.payment_status = PaymentStatus.PAID
            order.order_status = OrderStatus.CONFIRMED 
            
            # Save the payment ID if available
            try:
                 order.razorpay_payment_id = data["payload"]["payment"]["entity"]["id"]
            except KeyError:
                 pass

            # Apply Coupon usage logic in background
            if order.coupon_code and order.discount_amount > 0:
                applied_coupon = db.query(Coupon).filter(Coupon.code == order.coupon_code).first()
                if applied_coupon:
                    applied_coupon.used_count += 1
                    if order.user_id:
                        usage_record = CouponUsage(
                            coupon_id=applied_coupon.id,
                            user_id=order.user_id,
                            order_id=order.id,
                            discount_amount=order.discount_amount
                        )
                        db.add(usage_record)

            db.commit()
            return {"status": "success", "message": "Order successfully confirmed via webhook."}

        return {"status": "ignored", "reason": "Unhandled event type"}

    except Exception as e:
        print(f"RAZORPAY WEBHOOK ERROR: {str(e)}")
        return {"status": "error", "message": str(e)}