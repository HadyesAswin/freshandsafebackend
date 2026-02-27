# QWQER Integration - Issues & Fixes

## 🔴 CRITICAL ISSUE #1: Invalid payment_mode Value

### Problem
The `payment_mode` is set to `8`, which is NOT a valid value according to QWQER documentation.

### Location
**File:** `backend/app/services/qwqer_service.py`
**Line:** 48

### Current Code
```python
payload = {
    ...
    "payment_mode": 8,  # ❌ INVALID - Causes QE800 error
    ...
}
```

### Valid Values (from QWQER docs)
- `1` - Cash on Pickup
- `3` - Cash on Delivery
- `5` - Credit
- `6` - Wallet

### Error Response You'll Get
```json
{
    "message": "Please provide valid data.",
    "data": {
        "errors": {
            "payment_mode": [
                "\"8\" is not a valid choice."
            ]
        }
    },
    "is_success": false,
    "error": {
        "code": "QE800",
        "message": "Please provide valid data.",
        "details": "Please check the documentation to see the required fields and valid options."
    }
}
```

### Why order_key is NOT Generated
When QWQER API receives an invalid `payment_mode`, it rejects the entire request and returns an error response WITHOUT generating an `order_key`. This is why you're not getting the order_key.

### Recommended Fix
Change to `payment_mode: 3` (Cash on Delivery) - most suitable for grocery delivery:

```python
"payment_mode": 3,  # ✅ Cash on Delivery
```

---

## ⚠️ ISSUE #2: Hardcoded House Numbers

### Problem
`from_house_number` and `to_house_number` are hardcoded values instead of being captured from actual data.

### Location
**File:** `backend/app/services/qwqer_service.py`
**Lines:** 30-31, 40-41

### Current Code
```python
"from_house_number": "Shop 1",  # ❌ Hardcoded
...
"to_house_number": "Flat 4B",   # ❌ Hardcoded
```

### Why This Matters
- QWQER uses house numbers to help delivery partners locate the exact pickup/delivery point
- Hardcoded values mean all orders will have the same house number
- This can cause delivery failures or delays

### Required Changes

#### Step 1: Update Order Model
**File:** `backend/app/models.py`

Add these fields to the `Order` class:
```python
class Order(Base):
    __tablename__ = "orders"
    
    # ... existing fields ...
    
    # Add these new fields:
    delivery_house_number = Column(String, nullable=True)  # NEW
    
    # ... rest of the model ...
```

#### Step 2: Update Order Schema
**File:** `backend/app/schemas/order.py`

Add field to `OrderCreate`:
```python
class OrderCreate(BaseModel):
    # ... existing fields ...
    
    delivery_house_number: Optional[str] = None  # NEW
    
    # ... rest of schema ...
```

#### Step 3: Update Orders Endpoint
**File:** `backend/app/api/v1/endpoints/orders.py`

Update the `create_order` function:
```python
new_order = Order(
    # ... existing fields ...
    delivery_house_number=order_data.delivery_house_number,  # NEW
    # ... rest of fields ...
)
```

#### Step 4: Update QWQER Service
**File:** `backend/app/services/qwqer_service.py`

Use the actual value instead of hardcoded:
```python
"from_house_number": outlet.landmark or "Shop",  # Use outlet landmark or default
"to_house_number": order.delivery_house_number or "Residence",  # Use actual value
```

#### Step 5: Update Frontend
Capture house number in checkout form and include in the order creation request.

---

## ⚠️ ISSUE #3: Missing Delivery Coordinates

### Problem
`delivery_latitude` and `delivery_longitude` may not be captured during checkout, causing fallback to hardcoded Kochi coordinates.

### Location
**File:** `backend/app/services/qwqer_service.py`
**Lines:** 42-43

### Current Code
```python
"to_latitude": float(getattr(order, 'delivery_latitude', 10.0246) or 10.0246),
"to_longitude": float(getattr(order, 'delivery_longitude', 76.3075) or 76.3075),
```

### Why This Matters
- QWQER uses coordinates for accurate delivery routing
- Hardcoded coordinates (10.0246, 76.3075) are generic Kochi location
- If actual coordinates are missing, delivery partner may go to wrong location

### Required Changes

#### Step 1: Ensure Coordinates are Captured
**File:** `backend/app/schemas/order.py`

Add to `OrderCreate`:
```python
class OrderCreate(BaseModel):
    # ... existing fields ...
    
    delivery_latitude: Optional[float] = None   # NEW
    delivery_longitude: Optional[float] = None  # NEW
    
    # ... rest of schema ...
```

#### Step 2: Store Coordinates in Database
**File:** `backend/app/api/v1/endpoints/orders.py`

Update `create_order` function:
```python
new_order = Order(
    # ... existing fields ...
    delivery_latitude=order_data.delivery_latitude,   # NEW
    delivery_longitude=order_data.delivery_longitude, # NEW
    # ... rest of fields ...
)
```

#### Step 3: Frontend Implementation
In your checkout page, use Google Maps API to geocode the address:

```javascript
// Example: Convert address to coordinates
const geocodeAddress = async (address) => {
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=YOUR_API_KEY`
  );
  const data = await response.json();
  if (data.results.length > 0) {
    const { lat, lng } = data.results[0].geometry.location;
    return { latitude: lat, longitude: lng };
  }
};
```

---

## ⚠️ ISSUE #4: Incorrect item_type Default

### Problem
Default `item_type` is `1` (Documents/Books), but this is a grocery delivery service.

### Location
**File:** `backend/app/services/qwqer_service.py`
**Line:** 50

### Current Code
```python
def create_delivery_order(self, outlet: Outlet, order: Order, weight: float = 1.0, item_type: int = 1):
    ...
    "item_type": item_type  # Default is 1 (Documents/Books)
```

### Valid item_type Values (from QWQER docs)
- `1` - Documents/Books
- `2` - Medicines
- `3` - **Groceries** ← Should be this for your business
- `4` - Clothes/Accessories
- `5` - Electronic Items/Mobile/Laptop
- `8` - Others (requires `item_type_comment`)
- `44` - Cake
- `45` - Food (Hot/immediate consumption)
- `46` - Food (Snacks/Packaged)
- `47` - Gift
- `48` - Meat/Fish

### Recommended Fix
Change default to `3` (Groceries):

```python
def create_delivery_order(self, outlet: Outlet, order: Order, weight: float = 1.0, item_type: int = 3):
    ...
    "item_type": item_type  # ✅ Default is 3 (Groceries)
```

---

## ⚠️ ISSUE #5: Incorrect Weight Calculation

### Problem
Weight is hardcoded to `1.0 kg` for all orders, but QWQER pricing is weight-based.

### Location
**File:** `backend/app/services/qwqer_service.py`
**Line:** 50

### Current Code
```python
def create_delivery_order(self, outlet: Outlet, order: Order, weight: float = 1.0, item_type: int = 1):
    ...
    "weight": float(weight),  # Always 1.0 kg
```

### Why This Matters
- QWQER calculates delivery charges based on weight
- Incorrect weight = incorrect delivery charges
- Customer may be overcharged or undercharged

### Recommended Fix
Calculate weight from order items:

```python
def create_delivery_order(self, outlet: Outlet, order: Order, weight: float = None, item_type: int = 3):
    """API 1: Create Order in QWQER"""
    
    # Calculate weight from order items if not provided
    if weight is None:
        weight = 0.0
        for item in order.order_items:
            # Assuming each product has a weight field (in kg)
            product_weight = getattr(item.product, 'weight', 0.5)  # Default 0.5 kg per item
            weight += product_weight * item.quantity
        weight = max(weight, 1.0)  # Minimum 1 kg
    
    payload = {
        ...
        "weight": float(weight),
        ...
    }
```

**Also update Product model** to include weight:
```python
class Product(Base):
    __tablename__ = "products"
    
    # ... existing fields ...
    weight = Column(Float, default=0.5)  # Weight in kg
    # ... rest of model ...
```

---

## 📋 VERIFICATION CHECKLIST

### Before Dispatch
- [ ] `payment_mode` is set to `1`, `3`, `5`, or `6` (NOT `8`)
- [ ] `from_house_number` is not hardcoded
- [ ] `to_house_number` is captured from user input
- [ ] `delivery_latitude` and `delivery_longitude` are captured
- [ ] `item_type` is set to `3` (Groceries) or appropriate value
- [ ] `weight` is calculated from order items
- [ ] `merchant_order_id` is unique (order_number)
- [ ] All required fields are present and not null

### After Dispatch
- [ ] Response contains `order_key` in `data` object
- [ ] `is_success` is `true`
- [ ] `error` is `false`
- [ ] `qwqer_order_id` is saved to database
- [ ] Order status is updated to `OUT_FOR_DELIVERY`

---

## 🧪 Test Payload (After Fixes)

```json
{
  "description": "Fresh and Safe Order ORD-20250224-ABC123",
  "from_name": "Fresh and Safe Outlet",
  "from_phone": "+919876543210",
  "from_address": "123 Store Street, Kochi",
  "from_locality": "Kochi",
  "from_pincode": "682030",
  "from_house_number": "Shop 1",
  "from_latitude": 9.9312,
  "from_longitude": 76.2673,
  "to_name": "John Doe",
  "to_phone": "+919876543211",
  "to_address": "456 Customer Street, Kochi",
  "to_locality": "Kochi",
  "to_pincode": "682030",
  "to_house_number": "Flat 4B",
  "to_latitude": 10.0246,
  "to_longitude": 76.3075,
  "merchant_order_id": "ORD-20250224-ABC123",
  "store_order_id": "ORD-20250224-ABC123",
  "weight": 2.5,
  "payment_mode": 3,
  "merchant_order_amount": 500.0,
  "item_type": 3
}
```

**Expected Success Response:**
```json
{
  "message": "Success.",
  "data": {
    "order_key": "357837",
    "otp": "9876",
    "pickup_otp": "12345",
    "delivery_amount": 22.0,
    "total_amount": 22.0,
    "assignment_sla": "300.0",
    "pickup_sla": "600.0"
  },
  "is_success": true,
  "error": false
}
```

---

## 🔗 API Endpoints Summary

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/api/v1/orders/checkout` | POST | Create order | ✅ Working |
| `/api/v1/orders/{order_id}/dispatch` | POST | Dispatch to QWQER | ⚠️ Needs fixes |
| `/api/v1/orders/{order_id}/track` | GET | Track delivery | ✅ Working |
| `/api/v1/orders/{order_id}/cancel-delivery` | POST | Cancel delivery | ✅ Working |
| `/api/v1/orders/qwqer-webhook` | POST | Receive updates | ✅ Working |

---

## 📞 Support

For QWQER API issues:
- **Base URL:** `https://stage-api.qwqer.in/v2/`
- **API Key:** `5uPZIT5GZKwom82dUbZKSAMRC3DrPglXas0ApMFvMptXMQJiEIImzxMFKKzQRqgM`
- **Documentation:** Refer to attached QWQER V2 API documentation

---

**Last Updated:** 2025-02-24
**Status:** Analysis Complete - Awaiting Implementation
