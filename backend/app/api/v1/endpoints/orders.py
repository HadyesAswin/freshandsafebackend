from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from app.core.database import get_db
from app.models import Order, OrderItem, Product, OrderStatus, PaymentStatus, UserAddress
# ✅ Imported AddressUpdate here
from app.schemas.order import OrderCreate, OrderResponse, AddressUpdate 
import uuid
import datetime

router = APIRouter()

def generate_order_number():
    date_str = datetime.datetime.now().strftime("%Y%m%d")
    short_uuid = str(uuid.uuid4())[:6].upper()
    return f"ORD-{date_str}-{short_uuid}"

# ==========================================
# 1. CREATE ORDER (With Auto-Save Address)
# ==========================================
@router.post("/checkout", response_model=OrderResponse)
def create_order(order_data: OrderCreate, db: Session = Depends(get_db)):
    
    calculated_subtotal = sum(item.price_per_unit * item.quantity for item in order_data.items)
    tax_amount = 0.0
    delivery_fee = 0.0 if calculated_subtotal > 500 else 50.0
    discount_amount = 0.0 
    final_total = calculated_subtotal + tax_amount + delivery_fee - discount_amount

    # --- AUTO-SAVE ADDRESS LOGIC ---
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
                zipcode=order_data.delivery_zipcode
            )
            db.add(new_address)

    # Create Order
    new_order = Order(
        order_number=generate_order_number(),
        user_id=order_data.user_id,
        outlet_id=order_data.outlet_id,
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
        subtotal=calculated_subtotal,
        tax_amount=tax_amount,
        delivery_fee=delivery_fee,
        discount_amount=discount_amount,
        total_amount=final_total,
        payment_method=order_data.payment_method,
        coupon_code=order_data.coupon_code,
        customer_note=order_data.customer_note,
        order_status=OrderStatus.PENDING,
        payment_status=PaymentStatus.PENDING
    )

    db.add(new_order)
    db.flush()

    for item in order_data.items:
        db_item = OrderItem(
            order_id=new_order.id,
            product_id=item.product_id,
            quantity=item.quantity,
            price_per_unit=item.price_per_unit,
            total_price=(item.price_per_unit * item.quantity)
        )
        db.add(db_item)

    db.commit()
    db.refresh(new_order)

    return {
        "id": new_order.id,
        "order_number": new_order.order_number,
        "total_amount": new_order.total_amount,
        "status": "success"
    }

# ==========================================
# 2. GET USER'S ORDER HISTORY
# ==========================================
@router.get("/my-orders/{user_id}")
def get_user_orders(user_id: int, db: Session = Depends(get_db)):
    orders = db.query(Order).filter(Order.user_id == user_id).order_by(Order.created_at.desc()).all()
    
    return [
        {
            "id": order.id,
            "order_number": order.order_number,
            "date": order.created_at.strftime("%Y-%m-%d"),
            "total_amount": order.total_amount,
            "status": order.order_status,
            "items_count": len(order.order_items)
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
                "subtotal": item.total_price
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
    
    db.commit()
    return {"message": "Address updated successfully"}