from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional
from datetime import datetime

# --- Product Helper ---
class ProductSimple(BaseModel):
    id: int
    name: str
    
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
    
    payment_method: str = "online"
    coupon_code: Optional[str] = None
    customer_note: Optional[str] = None
    
    items: List[OrderItemCreate]

class OrderResponse(BaseModel):
    id: int
    order_number: str
    total_amount: float
    
    # ✅ Status mapping for frontend
    order_status: Optional[str] = Field(default="pending", alias="status")
    payment_status: str = "pending"
    created_at: Optional[datetime] = None 

    # ✅ ADDED: Customer Details (Missing previously)
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None

    # ✅ ADDED: Delivery Details (Missing previously)
    delivery_name: Optional[str] = None
    delivery_phone: Optional[str] = None
    delivery_address_line1: Optional[str] = None
    delivery_address_line2: Optional[str] = None
    delivery_city: Optional[str] = None
    delivery_state: Optional[str] = None
    delivery_zipcode: Optional[str] = None
    
    # ✅ Items and Notes
    customer_note: Optional[str] = None
    order_items: List[OrderItemResponse] = []

    model_config = ConfigDict(
        from_attributes=True, 
        populate_by_name=True, 
        use_enum_values=True   
    )

# --- Updates & Specialized Schemas ---
class AddressUpdate(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    address_line1: str
    address_line2: Optional[str] = None
    city: str
    state: str
    zipcode: str

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