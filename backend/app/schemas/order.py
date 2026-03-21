from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional
from datetime import datetime

# --- Product Helper ---
class ProductSimple(BaseModel):
    id: int
    name: str
    # ✅ THE FIX: Allow the unit (e.g., '500g', '1kg') to pass through to the frontend
    unit: Optional[str] = None 
    
    model_config = ConfigDict(from_attributes=True)

# --- Items within an Order ---
class OrderItemBase(BaseModel):
    product_id: int
    quantity: int
    price_per_unit: float

    model_config = ConfigDict(from_attributes=True)

class OrderItemCreate(OrderItemBase):
    pass

class OrderItemResponse(OrderItemBase):
    id: int
    # Include product object so i.product.name works in frontend
    product: Optional[ProductSimple] = None 

    model_config = ConfigDict(from_attributes=True)

# --- Order Core ---
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
    
    # Accept exact coordinates from the frontend
    delivery_latitude: Optional[float] = None
    delivery_longitude: Optional[float] = None

    delivery_fee: float = 0.0
    
    payment_method: str = "online"
    coupon_code: Optional[str] = None
    customer_note: Optional[str] = None
    
    items: List[OrderItemCreate]

# --- Order Core ---
class OrderResponse(BaseModel):
    id: int
    order_number: str
    total_amount: float
    
    customer_note: Optional[str] = None
    # Financial fields
    subtotal: float = 0.0
    discount_amount: float = 0.0
    delivery_fee: float = 0.0
    tax_amount: float = 0.0
    
    # Status mapping for frontend
    order_status: Optional[str] = Field(default="pending", alias="status")
    payment_status: str = "pending"
    created_at: Optional[datetime] = None 

    # Customer Details 
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None

    # Delivery Details
    delivery_name: Optional[str] = None
    delivery_phone: Optional[str] = None
    delivery_address_line1: Optional[str] = None
    delivery_address_line2: Optional[str] = None
    delivery_city: Optional[str] = None
    delivery_state: Optional[str] = None
    delivery_zipcode: Optional[str] = None
    
    # Items and Notes
    customer_note: Optional[str] = None
    order_items: List[OrderItemResponse] = []

    # RAZORPAY ADDITIONS
    razorpay_order_id: Optional[str] = None  
    razorpay_key: Optional[str] = None

    qwqer_order_id: Optional[str] = None
    qwqer_status: Optional[str] = None

    model_config = ConfigDict(
        from_attributes=True, 
        populate_by_name=True, 
        use_enum_values=True   
    )

# --- Updates & Specialized Schemas ---
class AddressUpdate(BaseModel):
    user_id: Optional[int] = None
    name: str
    phone: str
    email: Optional[str] = None
    address_line1: str
    address_line2: Optional[str] = None
    city: str
    state: str
    zipcode: str

    latitude: Optional[float] = None
    longitude: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)

class OrderStatusUpdate(BaseModel):
    status: str


class SalesReportItem(BaseModel):
    date: str
    order_count: int
    total_revenue: float

class SalesReportResponse(BaseModel):
    outlet_id: int
    total_period_revenue: float
    total_period_orders: float
    report_data: List[SalesReportItem]

class DeliveryFeeRequest(BaseModel):
    outlet_id: int
    delivery_latitude: Optional[float] = None
    delivery_longitude: Optional[float] = None
    delivery_zipcode: str
    weight: float = 1.0     


class PaymentVerification(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str