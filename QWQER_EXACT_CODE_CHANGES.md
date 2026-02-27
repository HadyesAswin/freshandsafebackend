# QWQER Integration - Exact Code Changes Required

## 🔴 CRITICAL FIX #1: payment_mode Value

**File:** `backend/app/services/qwqer_service.py`
**Line:** 48

### Current Code (BROKEN)
```python
payload = {
    "description": f"Fresh and Safe Order {order.order_number}"[:100],
    "from_name": outlet.outlet_name or "Fresh and Safe Outlet",
    "from_phone": f"+91{from_phone}",
    "from_address": outlet.address or "Store Location",
    "from_locality": outlet.city or "Kochi",
    "from_pincode": outlet.zipcode or "682030",
    "from_house_number": "Shop 1", 
    "from_latitude": float(outlet.latitude) if outlet.latitude else 9.9312,
    "from_longitude": float(outlet.longitude) if outlet.longitude else 76.2673,
    "to_name": order.delivery_name or "Customer",
    "to_phone": f"+91{to_phone}",
    "to_address": f"{order.delivery_address_line1} {order.delivery_address_line2 or ''}".strip(),
    "to_locality": order.delivery_city or "Kochi",
    "to_pincode": order.delivery_zipcode or "682030",
    "to_house_number": "Flat 4B", 
    "to_latitude": float(getattr(order, 'delivery_latitude', 10.0246) or 10.0246),
    "to_longitude": float(getattr(order, 'delivery_longitude', 76.3075) or 76.3075),
    "merchant_order_id": order.order_number,
    "store_order_id": order.order_number,
    "weight": float(weight),
    "payment_mode": 8,  # ❌ INVALID - CAUSES QE800 ERROR
    "merchant_order_amount": float(order.total_amount),
    "item_type": item_type
}
```

### Fixed Code (WORKING)
```python
payload = {
    "description": f"Fresh and Safe Order {order.order_number}"[:100],
    "from_name": outlet.outlet_name or "Fresh and Safe Outlet",
    "from_phone": f"+91{from_phone}",
    "from_address": outlet.address or "Store Location",
    "from_locality": outlet.city or "Kochi",
    "from_pincode": outlet.zipcode or "682030",
    "from_house_number": "Shop 1", 
    "from_latitude": float(outlet.latitude) if outlet.latitude else 9.9312,
    "from_longitude": float(outlet.longitude) if outlet.longitude else 76.2673,
    "to_name": order.delivery_name or "Customer",
    "to_phone": f"+91{to_phone}",
    "to_address": f"{order.delivery_address_line1} {order.delivery_address_line2 or ''}".strip(),
    "to_locality": order.delivery_city or "Kochi",
    "to_pincode": order.delivery_zipcode or "682030",
    "to_house_number": "Flat 4B", 
    "to_latitude": float(getattr(order, 'delivery_latitude', 10.0246) or 10.0246),
    "to_longitude": float(getattr(order, 'delivery_longitude', 76.3075) or 76.3075),
    "merchant_order_id": order.order_number,
    "store_order_id": order.order_number,
    "weight": float(weight),
    "payment_mode": 3,  # ✅ FIXED - Cash on Delivery
    "merchant_order_amount": float(order.total_amount),
    "item_type": item_type
}
```

### Change Summary
```diff
- "payment_mode": 8,
+ "payment_mode": 3,
```

---

## ⚠️ FIX #2: item_type Default Value

**File:** `backend/app/services/qwqer_service.py`
**Line:** 50

### Current Code (WRONG)
```python
def create_delivery_order(self, outlet: Outlet, order: Order, weight: float = 1.0, item_type: int = 1):
    """API 1: Create Order in QWQER"""
    
    base = self.base_url.rstrip("/")
    url = f"{base}/client/order/"
    
    from_phone = "".join(filter(str.isdigit, outlet.phone))[-10:] if outlet.phone else "9876543210"
    to_phone = "".join(filter(str.isdigit, order.delivery_phone))[-10:] if order.delivery_phone else "9876543210"

    payload = {
        # ... payload code ...
        "item_type": item_type  # Default is 1 (Documents/Books) - WRONG for grocery
    }
```

### Fixed Code (CORRECT)
```python
def create_delivery_order(self, outlet: Outlet, order: Order, weight: float = 1.0, item_type: int = 3):
    """API 1: Create Order in QWQER"""
    
    base = self.base_url.rstrip("/")
    url = f"{base}/client/order/"
    
    from_phone = "".join(filter(str.isdigit, outlet.phone))[-10:] if outlet.phone else "9876543210"
    to_phone = "".join(filter(str.isdigit, order.delivery_phone))[-10:] if order.delivery_phone else "9876543210"

    payload = {
        # ... payload code ...
        "item_type": item_type  # Default is 3 (Groceries) - CORRECT
    }
```

### Change Summary
```diff
- def create_delivery_order(self, outlet: Outlet, order: Order, weight: float = 1.0, item_type: int = 1):
+ def create_delivery_order(self, outlet: Outlet, order: Order, weight: float = 1.0, item_type: int = 3):
```

---

## ⚠️ FIX #3: Add delivery_house_number to Order Model

**File:** `backend/app/models.py`

### Current Code (INCOMPLETE)
```python
class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String, unique=True, index=True, nullable=False)

    # Relationships (Who ordered it, and from which shop?)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    outlet_id = Column(Integer, ForeignKey("outlets.id"), nullable=False, index=True)

    # Customer Info Snapshot
    customer_name = Column(String, nullable=False)
    customer_phone = Column(String, nullable=False)
    customer_email = Column(String, nullable=True)

    # Delivery Info Snapshot
    delivery_name = Column(String, nullable=False)
    delivery_phone = Column(String, nullable=False)
    delivery_address_line1 = Column(String, nullable=False)
    delivery_address_line2 = Column(String, nullable=True)
    delivery_city = Column(String, nullable=False)
    delivery_state = Column(String, nullable=False)
    delivery_zipcode = Column(String, nullable=False)
    
    # Coordinates (For QWQER later)
    delivery_latitude = Column(Float, nullable=True)
    delivery_longitude = Column(Float, nullable=True)
    
    # ... rest of model ...
```

### Fixed Code (COMPLETE)
```python
class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String, unique=True, index=True, nullable=False)

    # Relationships (Who ordered it, and from which shop?)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    outlet_id = Column(Integer, ForeignKey("outlets.id"), nullable=False, index=True)

    # Customer Info Snapshot
    customer_name = Column(String, nullable=False)
    customer_phone = Column(String, nullable=False)
    customer_email = Column(String, nullable=True)

    # Delivery Info Snapshot
    delivery_name = Column(String, nullable=False)
    delivery_phone = Column(String, nullable=False)
    delivery_address_line1 = Column(String, nullable=False)
    delivery_address_line2 = Column(String, nullable=True)
    delivery_city = Column(String, nullable=False)
    delivery_state = Column(String, nullable=False)
    delivery_zipcode = Column(String, nullable=False)
    delivery_house_number = Column(String, nullable=True)  # ✅ NEW FIELD
    
    # Coordinates (For QWQER later)
    delivery_latitude = Column(Float, nullable=True)
    delivery_longitude = Column(Float, nullable=True)
    
    # ... rest of model ...
```

### Change Summary
```diff
    delivery_zipcode = Column(String, nullable=False)
+   delivery_house_number = Column(String, nullable=True)  # NEW
    
    # Coordinates (For QWQER later)
```

---

## ⚠️ FIX #4: Add Fields to OrderCreate Schema

**File:** `backend/app/schemas/order.py`

### Current Code (INCOMPLETE)
```python
class OrderCreate(BaseModel):
    user_id: Optional[int] = None 
    outlet_id: int
    customer_name: str
    customer_phone: str
    customer_email: Optional[str] = None
    
    delivery_name: str
    delivery_phone: str
    delivery_address_line1: str
    delivery_address_line2: Optional[str] = None
    delivery_city: str
    delivery_state: str
    delivery_zipcode: str
    
    payment_method: str = "online"
    coupon_code: Optional[str] = None
    customer_note: Optional[str] = None
    
    items: List[OrderItemCreate]
```

### Fixed Code (COMPLETE)
```python
class OrderCreate(BaseModel):
    user_id: Optional[int] = None 
    outlet_id: int
    customer_name: str
    customer_phone: str
    customer_email: Optional[str] = None
    
    delivery_name: str
    delivery_phone: str
    delivery_address_line1: str
    delivery_address_line2: Optional[str] = None
    delivery_city: str
    delivery_state: str
    delivery_zipcode: str
    delivery_house_number: Optional[str] = None  # ✅ NEW FIELD
    delivery_latitude: Optional[float] = None    # ✅ NEW FIELD
    delivery_longitude: Optional[float] = None   # ✅ NEW FIELD
    
    payment_method: str = "online"
    coupon_code: Optional[str] = None
    customer_note: Optional[str] = None
    
    items: List[OrderItemCreate]
```

### Change Summary
```diff
    delivery_zipcode: str
+   delivery_house_number: Optional[str] = None
+   delivery_latitude: Optional[float] = None
+   delivery_longitude: Optional[float] = None
    
    payment_method: str = "online"
```

---

## ⚠️ FIX #5: Update Order Creation in Endpoint

**File:** `backend/app/api/v1/endpoints/orders.py`

### Current Code (INCOMPLETE)
```python
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
        order_status=OrderStatus.CONFIRMED,
        payment_status=PaymentStatus.PAID
    )
```

### Fixed Code (COMPLETE)
```python
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
        delivery_house_number=order_data.delivery_house_number,  # ✅ NEW
        delivery_latitude=order_data.delivery_latitude,          # ✅ NEW
        delivery_longitude=order_data.delivery_longitude,        # ✅ NEW
        subtotal=calculated_subtotal,
        tax_amount=tax_amount,
        delivery_fee=delivery_fee,
        discount_amount=discount_amount,
        total_amount=final_total,
        payment_method=order_data.payment_method,
        coupon_code=order_data.coupon_code,
        customer_note=order_data.customer_note,
        order_status=OrderStatus.CONFIRMED,
        payment_status=PaymentStatus.PAID
    )
```

### Change Summary
```diff
        delivery_zipcode=order_data.delivery_zipcode,
+       delivery_house_number=order_data.delivery_house_number,
+       delivery_latitude=order_data.delivery_latitude,
+       delivery_longitude=order_data.delivery_longitude,
        subtotal=calculated_subtotal,
```

---

## ⚠️ FIX #6: Update QWQER Service to Use Dynamic Values

**File:** `backend/app/services/qwqer_service.py`

### Current Code (HARDCODED)
```python
payload = {
    "description": f"Fresh and Safe Order {order.order_number}"[:100],
    "from_name": outlet.outlet_name or "Fresh and Safe Outlet",
    "from_phone": f"+91{from_phone}",
    "from_address": outlet.address or "Store Location",
    "from_locality": outlet.city or "Kochi",
    "from_pincode": outlet.zipcode or "682030",
    "from_house_number": "Shop 1",  # ❌ HARDCODED
    "from_latitude": float(outlet.latitude) if outlet.latitude else 9.9312,
    "from_longitude": float(outlet.longitude) if outlet.longitude else 76.2673,
    "to_name": order.delivery_name or "Customer",
    "to_phone": f"+91{to_phone}",
    "to_address": f"{order.delivery_address_line1} {order.delivery_address_line2 or ''}".strip(),
    "to_locality": order.delivery_city or "Kochi",
    "to_pincode": order.delivery_zipcode or "682030",
    "to_house_number": "Flat 4B",  # ❌ HARDCODED
    "to_latitude": float(getattr(order, 'delivery_latitude', 10.0246) or 10.0246),
    "to_longitude": float(getattr(order, 'delivery_longitude', 76.3075) or 76.3075),
    "merchant_order_id": order.order_number,
    "store_order_id": order.order_number,
    "weight": float(weight),
    "payment_mode": 8,  # ❌ INVALID
    "merchant_order_amount": float(order.total_amount),
    "item_type": item_type
}
```

### Fixed Code (DYNAMIC)
```python
payload = {
    "description": f"Fresh and Safe Order {order.order_number}"[:100],
    "from_name": outlet.outlet_name or "Fresh and Safe Outlet",
    "from_phone": f"+91{from_phone}",
    "from_address": outlet.address or "Store Location",
    "from_locality": outlet.city or "Kochi",
    "from_pincode": outlet.zipcode or "682030",
    "from_house_number": outlet.landmark or "Shop",  # ✅ DYNAMIC
    "from_latitude": float(outlet.latitude) if outlet.latitude else 9.9312,
    "from_longitude": float(outlet.longitude) if outlet.longitude else 76.2673,
    "to_name": order.delivery_name or "Customer",
    "to_phone": f"+91{to_phone}",
    "to_address": f"{order.delivery_address_line1} {order.delivery_address_line2 or ''}".strip(),
    "to_locality": order.delivery_city or "Kochi",
    "to_pincode": order.delivery_zipcode or "682030",
    "to_house_number": order.delivery_house_number or "Residence",  # ✅ DYNAMIC
    "to_latitude": float(order.delivery_latitude or 10.0246),  # ✅ SIMPLIFIED
    "to_longitude": float(order.delivery_longitude or 76.3075),  # ✅ SIMPLIFIED
    "merchant_order_id": order.order_number,
    "store_order_id": order.order_number,
    "weight": float(weight),
    "payment_mode": 3,  # ✅ FIXED
    "merchant_order_amount": float(order.total_amount),
    "item_type": item_type
}
```

### Change Summary
```diff
-   "from_house_number": "Shop 1",
+   "from_house_number": outlet.landmark or "Shop",

-   "to_house_number": "Flat 4B",
+   "to_house_number": order.delivery_house_number or "Residence",

-   "to_latitude": float(getattr(order, 'delivery_latitude', 10.0246) or 10.0246),
-   "to_longitude": float(getattr(order, 'delivery_longitude', 76.3075) or 76.3075),
+   "to_latitude": float(order.delivery_latitude or 10.0246),
+   "to_longitude": float(order.delivery_longitude or 76.3075),

-   "payment_mode": 8,
+   "payment_mode": 3,
```

---

## 📋 Summary of Changes

| File | Change | Type | Priority |
|------|--------|------|----------|
| qwqer_service.py | payment_mode: 8 → 3 | Critical | 1 |
| qwqer_service.py | item_type default: 1 → 3 | Medium | 4 |
| qwqer_service.py | Use dynamic house numbers | High | 2 |
| models.py | Add delivery_house_number column | High | 2 |
| order.py schema | Add 3 new fields | High | 2 |
| orders.py endpoint | Pass new fields to Order | High | 2 |

---

## ✅ Verification After Changes

1. **Database Migration:** Run alembic migration for new column
2. **Test Checkout:** Create order with all new fields
3. **Test Dispatch:** Verify order_key is generated
4. **Test Tracking:** Verify delivery status updates
5. **Test Webhook:** Verify status changes are received

---

**Last Updated:** 2025-02-24
**Status:** Ready for Implementation
