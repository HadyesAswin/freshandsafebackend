# QWQER Integration - Visual Flow & Debugging Guide

## 🔄 Current Order Flow (BROKEN)

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. USER CREATES ORDER                                           │
│    POST /api/v1/orders/checkout                                 │
│    ✅ Order created in database                                 │
│    ✅ order_number generated                                    │
│    ✅ Order status = CONFIRMED                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────���───────────────┐
│ 2. ADMIN DISPATCHES ORDER                                       │
│    POST /api/v1/orders/{order_id}/dispatch                      │
│    ✅ Calls qwqer_api.create_delivery_order()                   │
│    ✅ Builds payload with order details                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. QWQER API RECEIVES REQUEST                                   │
│    POST https://stage-api.qwqer.in/v2/client/order/             │
│    ❌ Payload contains: "payment_mode": 8                       │
│    ❌ QWQER validates: 8 is NOT valid                           │
│    ❌ QWQER rejects request with QE800 error                    │
└──────────────────────��──────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. ERROR RESPONSE RETURNED                                      │
│    {                                                             │
│      "message": "Please provide valid data.",                   │
│      "is_success": false,                                       │
│      "error": {                                                 │
│        "code": "QE800",                                         │
│        "message": "Please provide valid data.",                 │
│        "details": "\"8\" is not a valid choice."                │
│      }                                                          │
│    }                                                            │
│    ❌ NO order_key generated                                    │
│    ❌ Dispatch fails                                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Expected Order Flow (AFTER FIXES)

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. USER CREATES ORDER                                           │
│    POST /api/v1/orders/checkout                                 │
│    ✅ Order created in database                                 │
│    ✅ delivery_house_number captured                            │
│    ✅ delivery_latitude & delivery_longitude captured           │
│    ✅ Order status = CONFIRMED                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. ADMIN DISPATCHES ORDER                                       │
│    POST /api/v1/orders/{order_id}/dispatch                      │
│    ✅ Calls qwqer_api.create_delivery_order()                   │
│    ✅ Builds payload with CORRECT values:                       │
│       - payment_mode: 3 (Cash on Delivery)                      │
│       - item_type: 3 (Groceries)                                │
│       - weight: calculated from items                           │
│       - delivery_house_number: from user input                  │
│       - delivery_latitude/longitude: from user input            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. QWQER API RECEIVES REQUEST                                   │
│    POST https://stage-api.qwqer.in/v2/client/order/             │
│    ✅ Payload contains: "payment_mode": 3                       │
│    ✅ QWQER validates: 3 is VALID                               │
│    ✅ QWQER processes order                                     │
│    ✅ QWQER generates order_key                                 │
└────────────────────────────────────────────────���────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. SUCCESS RESPONSE RETURNED                                    │
│    {                                                             │
│      "message": "Success.",                                     │
│      "is_success": true,                                        │
│      "error": false,                                            │
│      "data": {                                                  │
│        "order_key": "357837",                                   │
│        "otp": "9876",                                           │
│        "pickup_otp": "12345",                                   │
│        "delivery_amount": 22.0,                                 │
│        "total_amount": 22.0,                                    │
│        "assignment_sla": "300.0",                               │
│        "pickup_sla": "600.0"                                    │
│      }                                                          │
│    }                                                            │
│    ✅ order_key = "357837" generated                            │
│    ✅ Saved to database: orders.qwqer_order_id                  │
│    ✅ Dispatch succeeds                                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. DELIVERY PARTNER ASSIGNED                                    │
│    ✅ QWQER assigns delivery partner                            │
│    ✅ Partner receives order details                            │
│    ✅ Real-time tracking begins                                 │
└───────────────────────���─────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. TRACK ORDER                                                  │
│    GET /api/v1/orders/{order_id}/track                          │
│    ✅ Returns real-time delivery status                         │
│    ✅ Driver location, ETA, etc.                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🐛 Debugging Guide

### Symptom #1: "order_key not in response"

**Check:**
1. Is `is_success` = `true`?
   - If NO → Check error code
   - If YES → Check data object

2. Is `error` = `false`?
   - If NO → Check error details

3. Is `data` object present?
   - If NO → API returned error

**Common Error Codes:**
- `QE800` → Invalid payment_mode (8 is not valid)
- `QE801` → No service in region (check coordinates)
- `QE807` → Duplicate merchant_order_id
- `QE814` → Amount collection disabled

---

### Symptom #2: "QE800 - Please provide valid data"

**This means:** One or more fields have invalid values

**Check:**
1. `payment_mode` - Must be 1, 3, 5, or 6 (NOT 8)
2. `item_type` - Must be valid (1, 2, 3, 4, 5, 8, 44, 45, 46, 47, 48)
3. `weight` - Must be > 0
4. `merchant_order_id` - Must be unique
5. All required fields present

**Solution:**
- Change `payment_mode` from 8 to 3
- Verify all required fields are present

---

### Symptom #3: "QE801 - No service in region"

**This means:** QWQER doesn't deliver to the specified coordinates

**Check:**
1. Are `delivery_latitude` and `delivery_longitude` correct?
2. Are they within QWQER's service area?
3. Are they hardcoded fallback values (10.0246, 76.3075)?

**Solution:**
- Capture actual coordinates from user
- Use Google Maps API to geocode address
- Verify coordinates are in QWQER service area

---

### Symptom #4: "QE807 - Order already saved with this merchant order id"

**This means:** An order with the same `merchant_order_id` already exists

**Check:**
1. Is `merchant_order_id` unique?
2. Is `order_number` unique?
3. Are you retrying the same order?

**Solution:**
- Ensure `order_number` is unique (it should be)
- Don't retry with same order_number

---

## 📊 Payload Comparison

### CURRENT PAYLOAD (BROKEN)
```json
{
  "description": "Fresh and Safe Order ORD-20250224-ABC123",
  "from_name": "Fresh and Safe Outlet",
  "from_phone": "+919876543210",
  "from_address": "123 Store Street",
  "from_locality": "Kochi",
  "from_pincode": "682030",
  "from_house_number": "Shop 1",
  "from_latitude": 9.9312,
  "from_longitude": 76.2673,
  "to_name": "John Doe",
  "to_phone": "+919876543211",
  "to_address": "456 Customer Street",
  "to_locality": "Kochi",
  "to_pincode": "682030",
  "to_house_number": "Flat 4B",
  "to_latitude": 10.0246,
  "to_longitude": 76.3075,
  "merchant_order_id": "ORD-20250224-ABC123",
  "store_order_id": "ORD-20250224-ABC123",
  "weight": 1.0,
  "payment_mode": 8,           ❌ INVALID
  "merchant_order_amount": 500.0,
  "item_type": 1               ❌ WRONG (Documents, not Groceries)
}
```

### EXPECTED PAYLOAD (WORKING)
```json
{
  "description": "Fresh and Safe Order ORD-20250224-ABC123",
  "from_name": "Fresh and Safe Outlet",
  "from_phone": "+919876543210",
  "from_address": "123 Store Street",
  "from_locality": "Kochi",
  "from_pincode": "682030",
  "from_house_number": "Shop 1",
  "from_latitude": 9.9312,
  "from_longitude": 76.2673,
  "to_name": "John Doe",
  "to_phone": "+919876543211",
  "to_address": "456 Customer Street",
  "to_locality": "Kochi",
  "to_pincode": "682030",
  "to_house_number": "Flat 4B",
  "to_latitude": 10.0246,
  "to_longitude": 76.3075,
  "merchant_order_id": "ORD-20250224-ABC123",
  "store_order_id": "ORD-20250224-ABC123",
  "weight": 2.5,               ✅ CALCULATED
  "payment_mode": 3,           ✅ VALID (Cash on Delivery)
  "merchant_order_amount": 500.0,
  "item_type": 3               ✅ CORRECT (Groceries)
}
```

---

## 🔍 How to Debug in Real-Time

### Step 1: Enable Logging
Add to `qwqer_service.py`:
```python
import logging
logger = logging.getLogger(__name__)

def create_delivery_order(self, outlet: Outlet, order: Order, weight: float = 1.0, item_type: int = 3):
    # ... code ...
    
    logger.info(f"QWQER Payload: {payload}")
    response = requests.post(url, json=payload, headers=self.headers)
    logger.info(f"QWQER Response: {response.json()}")
    
    return response.json()
```

### Step 2: Check Request/Response
```bash
# Check what's being sent
curl -X POST "https://stage-api.qwqer.in/v2/client/order/" \
  -H "ClientSecret: 5uPZIT5GZKwom82dUbZKSAMRC3DrPglXas0ApMFvMptXMQJiEIImzxMFKKzQRqgM" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Test Order",
    "from_name": "Test Shop",
    "from_phone": "+919876543210",
    "from_address": "Test Address",
    "from_locality": "Kochi",
    "from_pincode": "682030",
    "from_house_number": "Shop 1",
    "from_latitude": 9.9312,
    "from_longitude": 76.2673,
    "to_name": "Test Customer",
    "to_phone": "+919876543211",
    "to_address": "Test Delivery",
    "to_locality": "Kochi",
    "to_pincode": "682030",
    "to_house_number": "Flat 1",
    "to_latitude": 10.0246,
    "to_longitude": 76.3075,
    "merchant_order_id": "TEST-001",
    "store_order_id": "TEST-001",
    "weight": 1.0,
    "payment_mode": 3,
    "merchant_order_amount": 100.0,
    "item_type": 3
  }'
```

### Step 3: Verify Response
Look for:
- `"is_success": true`
- `"error": false`
- `"data": { "order_key": "..." }`

---

## 📋 Validation Checklist

Before calling dispatch endpoint:

```
Order Validation:
  ☐ order_id exists in database
  ☐ order_status = CONFIRMED
  ☐ total_amount > 0
  ☐ outlet_id is valid
  ☐ delivery_address_line1 is not empty
  ☐ delivery_city is not empty
  ☐ delivery_zipcode is not empty

Outlet Validation:
  ☐ outlet_id exists
  ☐ outlet.phone is valid
  ☐ outlet.address is not empty
  ☐ outlet.latitude is set
  ☐ outlet.longitude is set

Delivery Address Validation:
  ☐ delivery_name is not empty
  ☐ delivery_phone is valid
  ☐ delivery_house_number is set (NEW)
  ☐ delivery_latitude is set (NEW)
  ☐ delivery_longitude is set (NEW)

QWQER Payload Validation:
  ☐ payment_mode = 3 (not 8)
  ☐ item_type = 3 (not 1)
  ☐ weight > 0
  ☐ merchant_order_id is unique
  ☐ All required fields present
```

---

## 🎯 Success Indicators

After implementing fixes, you should see:

1. **Dispatch Response:**
   ```json
   {
     "message": "Delivery dispatched successfully",
     "qwqer_details": {
       "order_key": "357837",
       "otp": "9876",
       "delivery_amount": 22.0
     }
   }
   ```

2. **Database Update:**
   - `orders.qwqer_order_id` = "357837"
   - `orders.qwqer_status` = "Accepted"
   - `orders.order_status` = "out_for_delivery"

3. **Tracking Works:**
   ```json
   {
     "data": {
       "order_key": "357837",
       "status": "Accepted",
       "driver": {
         "name": "Driver Name",
         "phone": "+919876543210"
       }
     }
   }
   ```

---

**Last Updated:** February 24, 2025
**Status:** Debugging Guide Complete
