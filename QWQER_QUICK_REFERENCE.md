# QWQER Integration - Quick Reference Guide

## 🎯 Why order_key is NOT Being Generated

**Root Cause:** Invalid `payment_mode` value of `8`

QWQER API rejects the request with error code `QE800` before generating an `order_key`.

---

## 🔧 Quick Fixes Required

### Fix #1: Change payment_mode (CRITICAL)
**File:** `backend/app/services/qwqer_service.py` (Line 48)

```python
# BEFORE (❌ WRONG)
"payment_mode": 8,

# AFTER (✅ CORRECT)
"payment_mode": 3,  # Cash on Delivery
```

**Valid Values:**
- `1` = Cash on Pickup
- `3` = Cash on Delivery ← Recommended for grocery
- `5` = Credit
- `6` = Wallet

---

### Fix #2: Add delivery_house_number Field
**Files to modify:**
1. `backend/app/models.py` - Add column to Order model
2. `backend/app/schemas/order.py` - Add field to OrderCreate schema
3. `backend/app/api/v1/endpoints/orders.py` - Pass value to Order creation
4. `backend/app/services/qwqer_service.py` - Use actual value instead of "Flat 4B"

**Current (Hardcoded):**
```python
"to_house_number": "Flat 4B",  # ❌ Same for all orders
```

**After Fix:**
```python
"to_house_number": order.delivery_house_number or "Residence",  # ✅ Dynamic
```

---

### Fix #3: Capture Delivery Coordinates
**Files to modify:**
1. `backend/app/schemas/order.py` - Add latitude/longitude fields
2. `backend/app/api/v1/endpoints/orders.py` - Store coordinates
3. Frontend - Capture or geocode coordinates

**Current (Hardcoded):**
```python
"to_latitude": float(getattr(order, 'delivery_latitude', 10.0246) or 10.0246),
"to_longitude": float(getattr(order, 'delivery_longitude', 76.3075) or 76.3075),
```

**After Fix:**
```python
"to_latitude": float(order.delivery_latitude),
"to_longitude": float(order.delivery_longitude),
```

---

### Fix #4: Change item_type Default
**File:** `backend/app/services/qwqer_service.py` (Line 50)

```python
# BEFORE (❌ WRONG)
def create_delivery_order(self, outlet: Outlet, order: Order, weight: float = 1.0, item_type: int = 1):

# AFTER (✅ CORRECT)
def create_delivery_order(self, outlet: Outlet, order: Order, weight: float = 1.0, item_type: int = 3):
```

**Item Type Values:**
- `1` = Documents/Books
- `2` = Medicines
- `3` = Groceries ← Use this
- `4` = Clothes/Accessories
- `5` = Electronics
- `45` = Food (Hot)
- `46` = Food (Snacks/Packaged)
- `48` = Meat/Fish

---

### Fix #5: Calculate Weight from Order Items
**File:** `backend/app/services/qwqer_service.py`

```python
# BEFORE (❌ WRONG)
"weight": float(weight),  # Always 1.0 kg

# AFTER (✅ CORRECT)
# Calculate from order items
if weight is None:
    weight = sum(item.product.weight * item.quantity for item in order.order_items)
    weight = max(weight, 1.0)  # Minimum 1 kg
"weight": float(weight),
```

---

## 📊 Current vs Expected Behavior

### Current Behavior (❌ BROKEN)
```
1. User creates order
2. Admin clicks "Dispatch to QWQER"
3. QWQER API receives request with payment_mode: 8
4. QWQER rejects with QE800 error
5. No order_key generated
6. Dispatch fails
```

### Expected Behavior (✅ WORKING)
```
1. User creates order with delivery address & house number
2. Admin clicks "Dispatch to QWQER"
3. QWQER API receives request with payment_mode: 3
4. QWQER validates all fields
5. QWQER generates order_key: "357837"
6. order_key saved to database
7. Dispatch succeeds
8. Delivery partner assigned
```

---

## 🧪 Testing Steps

### Step 1: Fix payment_mode
Change line 48 in `qwqer_service.py` from `8` to `3`

### Step 2: Test Dispatch
```bash
POST /api/v1/orders/1/dispatch
```

### Step 3: Check Response
Should see:
```json
{
  "message": "Delivery dispatched successfully",
  "qwqer_details": {
    "order_key": "357837",
    ...
  }
}
```

### Step 4: Verify Database
Check that `orders.qwqer_order_id` = "357837"

### Step 5: Test Tracking
```bash
GET /api/v1/orders/1/track
```

Should return real-time delivery status from QWQER.

---

## 📋 Endpoint Status

| Endpoint | Issue | Status |
|----------|-------|--------|
| POST /orders/checkout | None | ✅ Working |
| POST /orders/{id}/dispatch | payment_mode=8 | ⚠️ Broken |
| GET /orders/{id}/track | Depends on dispatch | ⚠️ Blocked |
| POST /orders/{id}/cancel-delivery | None | ✅ Working |
| POST /orders/qwqer-webhook | None | ✅ Working |

---

## 🔍 Error Codes Reference

| Code | Meaning | Solution |
|------|---------|----------|
| QE800 | Invalid data | Fix payment_mode value |
| QE801 | No service in region | Check delivery coordinates |
| QE807 | Duplicate merchant_order_id | Ensure order_number is unique |
| QE814 | Amount collection disabled | Contact QWQER support |
| QE821 | Insufficient prepaid amount | Check account balance |

---

## 📞 QWQER API Details

**Base URL:** `https://stage-api.qwqer.in/v2/`

**API Key:** `5uPZIT5GZKwom82dUbZKSAMRC3DrPglXas0ApMFvMptXMQJiEIImzxMFKKzQRqgM`

**Required Header:**
```
ClientSecret: 5uPZIT5GZKwom82dUbZKSAMRC3DrPglXas0ApMFvMptXMQJiEIImzxMFKKzQRqgM
```

---

## ✅ Pre-Dispatch Checklist

Before calling dispatch endpoint, verify:

- [ ] Order created successfully
- [ ] Order has valid outlet_id
- [ ] Delivery address is complete
- [ ] Delivery coordinates are set (or will be geocoded)
- [ ] Order total_amount > 0
- [ ] payment_mode is 1, 3, 5, or 6 (NOT 8)
- [ ] item_type is valid (3 for groceries)
- [ ] weight is calculated correctly
- [ ] merchant_order_id is unique

---

## 🚀 Implementation Priority

1. **CRITICAL (Do First):** Fix payment_mode = 8 → 3
2. **HIGH (Do Next):** Add delivery_house_number field
3. **HIGH (Do Next):** Capture delivery coordinates
4. **MEDIUM (Do Later):** Fix item_type default
5. **MEDIUM (Do Later):** Calculate weight from items

**Estimated Time:** 30-45 minutes for all fixes

---

## 📝 Files to Modify

```
backend/
├── app/
│   ├── models.py                          ← Add fields to Order
│   ├── schemas/
│   │   └── order.py                       ← Add fields to OrderCreate
│   ├── services/
│   │   └── qwqer_service.py               ← Fix payment_mode, item_type, weight
│   └── api/v1/endpoints/
│       └── orders.py                      ← Pass new fields to Order creation
└── .env                                   ← Already configured ✅
```

---

**Last Updated:** 2025-02-24
**Status:** Ready for Implementation
