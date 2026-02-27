# QWQER Integration Analysis Report

## Executive Summary
The QWQER integration has been analyzed against the official QWQER V2 API documentation. **Critical issues have been identified that prevent order_key generation**. Below is a detailed breakdown of all findings.

---

## 🔴 CRITICAL ISSUES (Blocking order_key Generation)

### Issue #1: Invalid `payment_mode` Value
**Location:** `backend/app/services/qwqer_service.py` (Line 48)

**Current Code:**
```python
"payment_mode": 8,
```

**Problem:**
According to QWQER documentation, `payment_mode` accepts only these values:
- `1` - Cash on Pickup
- `3` - Cash on Delivery
- `5` - Credit
- `6` - Wallet

**Current value `8` is INVALID** and will cause the API to reject the request with error code `QE800` ("Please provide valid data").

**Expected Response Error:**
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

**Recommendation:**
Change `payment_mode` to `3` (Cash on Delivery) or `1` (Cash on Pickup) based on your business model.

---

### Issue #2: Missing Required Field - `from_house_number`
**Location:** `backend/app/services/qwqer_service.py` (Line 30-31)

**Current Code:**
```python
# ⚠️ NEW REQUIRED FIELD FOUND IN YOUR SCREENSHOT
"from_house_number": "Shop 1",
```

**Status:** ✅ ALREADY IMPLEMENTED (Good!)

The code correctly includes this required field. However, it's hardcoded as "Shop 1". Consider making it dynamic from the Outlet model if available.

---

### Issue #3: Missing Required Field - `to_house_number`
**Location:** `backend/app/services/qwqer_service.py` (Line 40-41)

**Current Code:**
```python
# ⚠️ NEW REQUIRED FIELD FOUND IN YOUR SCREENSHOT
"to_house_number": "Flat 4B",
```

**Status:** ✅ ALREADY IMPLEMENTED (Good!)

The code correctly includes this required field. However, it's hardcoded as "Flat 4B". This should be captured from the user's delivery address during checkout.

**Recommendation:**
Add `delivery_house_number` field to:
1. `OrderCreate` schema in `backend/app/schemas/order.py`
2. `Order` model in `backend/app/models.py`
3. Frontend checkout form

---

## ⚠️ WARNINGS (May Cause Issues)

### Warning #1: Hardcoded `item_type` Value
**Location:** `backend/app/services/qwqer_service.py` (Line 50)

**Current Code:**
```python
def create_delivery_order(self, outlet: Outlet, order: Order, weight: float = 1.0, item_type: int = 1):
    ...
    "item_type": item_type
```

**Issue:**
- Default `item_type` is `1` (Documents/Books)
- For a grocery/fresh produce business, this should be `3` (Groceries)
- If `item_type` is `8` (Others), then `item_type_comment` becomes REQUIRED

**Recommendation:**
Change default to `item_type: int = 3` for grocery orders, or make it configurable per product category.

---

### Warning #2: Hardcoded `weight` Value
**Location:** `backend/app/services/qwqer_service.py` (Line 50)

**Current Code:**
```python
def create_delivery_order(self, outlet: Outlet, order: Order, weight: float = 1.0, item_type: int = 1):
```

**Issue:**
- Default weight is `1.0 kg` for all orders
- QWQER pricing is weight-based
- Incorrect weight will result in wrong delivery charges

**Recommendation:**
Calculate weight from order items or allow it to be passed from the frontend.

---

### Warning #3: Potential Null Values in Coordinates
**Location:** `backend/app/services/qwqer_service.py` (Lines 32-33, 42-43)

**Current Code:**
```python
"from_latitude": float(outlet.latitude) if outlet.latitude else 9.9312,
"from_longitude": float(outlet.longitude) if outlet.longitude else 76.2673,
...
"to_latitude": float(getattr(order, 'delivery_latitude', 10.0246) or 10.0246),
"to_longitude": float(getattr(order, 'delivery_longitude', 76.3075) or 76.3075),
```

**Issue:**
- Fallback coordinates (9.9312, 76.2673) and (10.0246, 76.3075) are hardcoded
- These are generic Kochi coordinates
- If actual coordinates are missing, QWQER will use these defaults, causing incorrect delivery routing

**Recommendation:**
1. Ensure `delivery_latitude` and `delivery_longitude` are captured during checkout
2. Use geocoding API (Google Maps) to convert addresses to coordinates
3. Validate that coordinates are not null before sending to QWQER

---

## ✅ CORRECT IMPLEMENTATIONS

### ✅ API URL Configuration
**Location:** `backend/app/core/config.py` & `backend/.env`

```python
QWQER_API_URL: str = "https://stage-api.qwqer.in/v2/"
QWQER_CLIENT_SECRET: str = "5uPZIT5GZKwom82dUbZKSAMRC3DrPglXas0ApMFvMptXMQJiEIImzxMFKKzQRqgM"
```

**Status:** ✅ Correctly configured with staging environment

---

### ✅ Required Fields Implementation
**Location:** `backend/app/services/qwqer_service.py`

All required fields are present:
- ✅ `description` (100 char limit)
- ✅ `from_name`, `from_phone`, `from_address`, `from_pincode`
- ✅ `from_house_number` (NEW - correctly added)
- ✅ `from_latitude`, `from_longitude`
- ✅ `to_name`, `to_phone`, `to_address`, `to_pincode`
- ✅ `to_house_number` (NEW - correctly added)
- ✅ `to_latitude`, `to_longitude`
- ✅ `merchant_order_id` (unique order number)
- ✅ `weight`

---

### ✅ Endpoint Structure
**Location:** `backend/app/api/v1/endpoints/orders.py`

All required endpoints are implemented:
- ✅ `POST /api/v1/orders/checkout` - Create order
- ✅ `POST /api/v1/orders/{order_id}/dispatch` - Dispatch to QWQER
- ✅ `GET /api/v1/orders/{order_id}/track` - Track order
- ✅ `POST /api/v1/orders/{order_id}/cancel-delivery` - Cancel delivery
- ✅ `POST /api/v1/orders/qwqer-webhook` - Webhook receiver

---

### ✅ Database Model
**Location:** `backend/app/models.py`

QWQER fields are correctly added to Order model:
- ✅ `qwqer_order_id` - Stores the order_key from QWQER
- ✅ `qwqer_status` - Tracks delivery status
- ✅ `qwqer_assigned_at` - Timestamp of dispatch
- ✅ `delivery_latitude`, `delivery_longitude` - Coordinates for delivery

---

## 📋 ENDPOINT VERIFICATION CHECKLIST

### 1. Create Order Endpoint
**Endpoint:** `POST /api/v1/orders/checkout`
**Status:** ✅ Working
**Required Fields:** All present in `OrderCreate` schema

**Test Request:**
```json
{
  "outlet_id": 1,
  "customer_name": "John Doe",
  "customer_phone": "9876543210",
  "customer_email": "john@example.com",
  "delivery_name": "Jane Doe",
  "delivery_phone": "9876543211",
  "delivery_address_line1": "123 Main Street",
  "delivery_address_line2": "Apt 4B",
  "delivery_city": "Kochi",
  "delivery_state": "Kerala",
  "delivery_zipcode": "682030",
  "payment_method": "online",
  "items": [
    {
      "product_id": 1,
      "quantity": 2,
      "price_per_unit": 100.0
    }
  ]
}
```

---

### 2. Dispatch to QWQER Endpoint
**Endpoint:** `POST /api/v1/orders/{order_id}/dispatch`
**Status:** ⚠️ Will fail due to Issue #1 (invalid payment_mode)

**Expected Response (After Fix):**
```json
{
  "message": "Delivery dispatched successfully",
  "qwqer_details": {
    "order_key": "357837",
    "otp": "9876",
    "pickup_otp": "12345",
    "delivery_amount": 22.0,
    "total_amount": 22.0,
    "assignment_sla": "300.0",
    "pickup_sla": "600.0"
  }
}
```

---

### 3. Track Order Endpoint
**Endpoint:** `GET /api/v1/orders/{order_id}/track`
**Status:** �� Will work after dispatch

**Expected Response:**
```json
{
  "message": "",
  "data": {
    "order_key": "357883",
    "status": "Accepted",
    "location_coordinates": {
      "latitude": 8.5173,
      "longitude": 77.0237
    },
    "driver": {
      "name": "AIshwarya",
      "phone": "+919487654168"
    }
  },
  "is_success": true,
  "error": false
}
```

---

### 4. Cancel Delivery Endpoint
**Endpoint:** `POST /api/v1/orders/{order_id}/cancel-delivery`
**Status:** ✅ Correctly implemented

**Reason Codes (from QWQER docs):**
- 34 - Others
- 37 - Incorrect details entered while booking
- 38 - Item not ready
- 39 - Pickup delay/No partner assigned
- 40 - Delivery Partner refused pickup
- 41 - Delivery partner not responding
- 42 - QWQER asked to cancel
- 43 - Technical/payment Issues
- 44 - Found cheaper option
- 45 - Delivery partner without uniform/mask
- 46 - Delivery partner rude

---

### 5. Webhook Receiver Endpoint
**Endpoint:** `POST /api/v1/orders/qwqer-webhook`
**Status:** ✅ Correctly implemented

**Webhook Events Handled:**
- ✅ Accepted
- ✅ At Pickup
- ✅ Picked Up
- ✅ At Delivery
- ✅ Delivered
- ✅ Cancelled
- ✅ Undelivered
- ✅ Return order

---

## 🔧 REQUIRED FIXES (Priority Order)

### Priority 1: CRITICAL - Fix payment_mode
**File:** `backend/app/services/qwqer_service.py`
**Line:** 48
**Change:** `"payment_mode": 8,` → `"payment_mode": 3,`

### Priority 2: HIGH - Add delivery_house_number to schema
**Files to modify:**
1. `backend/app/schemas/order.py` - Add field to `OrderCreate`
2. `backend/app/models.py` - Add column to `Order` model
3. `backend/app/services/qwqer_service.py` - Use the field instead of hardcoded value

### Priority 3: HIGH - Ensure coordinates are captured
**Files to modify:**
1. `backend/app/schemas/order.py` - Add `delivery_latitude`, `delivery_longitude` to `OrderCreate`
2. Frontend checkout form - Capture or geocode coordinates

### Priority 4: MEDIUM - Fix item_type default
**File:** `backend/app/services/qwqer_service.py`
**Line:** 50
**Change:** `item_type: int = 1` → `item_type: int = 3`

### Priority 5: MEDIUM - Calculate weight from order items
**File:** `backend/app/services/qwqer_service.py`
**Implement:** Weight calculation logic based on product quantities

---

## 📊 API Response Status Codes Reference

| Code | Status | Meaning |
|------|--------|---------|
| QE000 | 500 | Something went wrong |
| QE400 | 401 | No API key provided |
| QE401 | 401 | Invalid API key |
| QE402 | 401 | Merchant account blocked |
| QE403 | 403 | Invalid order id |
| QE404 | 403 | No API permission |
| QE429 | 429 | Too many requests |
| **QE800** | **422** | **Invalid data (payment_mode issue)** |
| QE801 | 200 | No service in region |
| QE807 | 200 | Duplicate merchant_order_id |
| QE814 | 200 | Product amount collection disabled |
| QE821 | 200 | Insufficient prepaid amount |

---

## 🧪 Testing Recommendations

### Test 1: Verify API Connectivity
```bash
curl -X GET "https://stage-api.qwqer.in/v2/client/order/details/test" \
  -H "ClientSecret: 5uPZIT5GZKwom82dUbZKSAMRC3DrPglXas0ApMFvMptXMQJiEIImzxMFKKzQRqgM"
```

### Test 2: Create Order with Valid payment_mode
After fixing Issue #1, test the dispatch endpoint with a real order.

### Test 3: Verify Webhook Receiver
Configure QWQER to send webhooks to: `https://your-domain/api/v1/orders/qwqer-webhook`

### Test 4: Test All Order Statuses
Verify that all QWQER status updates are correctly mapped to your system.

---

## 📝 Summary

**Current Status:** ❌ **NOT READY FOR PRODUCTION**

**Blocking Issues:** 1 (payment_mode = 8)
**High Priority Issues:** 2 (house_number, coordinates)
**Medium Priority Issues:** 2 (item_type, weight)

**Estimated Fix Time:** 30-45 minutes

**Next Steps:**
1. Fix the `payment_mode` value immediately
2. Add `delivery_house_number` field to schema and model
3. Ensure coordinates are captured from frontend
4. Test dispatch endpoint with corrected values
5. Verify webhook integration with QWQER staging environment

---

## 📞 QWQER Support Information

**Base URL (Staging):** `https://stage-api.qwqer.in/v2/`
**API Key:** `5uPZIT5GZKwom82dUbZKSAMRC3DrPglXas0ApMFvMptXMQJiEIImzxMFKKzQRqgM`
**Documentation:** Refer to attached QWQER V2 API documentation

---

**Report Generated:** 2025-02-24
**Analysis Scope:** QWQER Integration - Order Creation & Delivery Tracking
