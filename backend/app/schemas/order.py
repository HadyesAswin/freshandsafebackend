from pydantic import BaseModel, EmailStr
from typing import List, Optional

class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int
    price_per_unit: float

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
    status: str

# ✅ NEW: Address Update Schema added here where it belongs!
class AddressUpdate(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    address_line1: str
    address_line2: Optional[str] = None
    city: str
    state: str
    zipcode: str