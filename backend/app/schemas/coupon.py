from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import List, Optional


# -------------------------
# Coupon Base Schemas
# -------------------------

class CouponBase(BaseModel):
    code: str
    description: Optional[str] = None
    discount_type: str = "fixed"  # "percentage" or "fixed"
    discount_value: float
    min_order_amount: float = 0
    max_discount_amount: Optional[float] = None
    total_usage_limit: Optional[int] = None
    usage_limit_per_user: int = 1
    valid_from: datetime
    valid_to: datetime
    applicable_type: str = "all"  # "all", "category", "product"
    status: bool = True


class CouponCreate(CouponBase):
    category_ids: List[int] = []
    product_ids: List[int] = []


class CouponUpdate(BaseModel):
    code: Optional[str] = None
    description: Optional[str] = None
    discount_type: Optional[str] = None
    discount_value: Optional[float] = None
    min_order_amount: Optional[float] = None
    max_discount_amount: Optional[float] = None
    total_usage_limit: Optional[int] = None
    usage_limit_per_user: Optional[int] = None
    valid_from: Optional[datetime] = None
    valid_to: Optional[datetime] = None
    applicable_type: Optional[str] = None
    status: Optional[bool] = None
    category_ids: Optional[List[int]] = None
    product_ids: Optional[List[int]] = None


# -------------------------
# Output Schemas
# -------------------------

class CategoryMini(BaseModel):
    id: int
    name: str
    
    # 🔥 FIX: Tell Pydantic how to read SQLAlchemy objects
    model_config = ConfigDict(from_attributes=True)


class ProductMini(BaseModel):
    id: int
    name: str
    
    # 🔥 FIX
    model_config = ConfigDict(from_attributes=True)


class CouponCategoryOut(BaseModel):
    category: CategoryMini
    
    # 🔥 FIX
    model_config = ConfigDict(from_attributes=True)


class CouponProductOut(BaseModel):
    product: ProductMini
    
    # 🔥 FIX
    model_config = ConfigDict(from_attributes=True)


class Coupon(BaseModel):
    id: int
    code: str
    description: Optional[str]
    discount_type: str
    discount_value: float
    min_order_amount: float
    max_discount_amount: Optional[float]
    total_usage_limit: Optional[int]
    usage_limit_per_user: int
    used_count: int
    valid_from: datetime
    valid_to: datetime
    applicable_type: str
    status: bool
    created_at: datetime

    categories: List[CouponCategoryOut] = []
    products: List[CouponProductOut] = []

    model_config = ConfigDict(from_attributes=True)


# -------------------------
# STRICT COUPON VALIDATION SCHEMAS
# -------------------------

class CartItemData(BaseModel):
    product_id: int
    quantity: int


class CouponValidateRequest(BaseModel):
    code: str
    subtotal: float
    items: List[CartItemData]   # STRICT MODE
    user_id: Optional[int] = None


class CouponValidateResponse(BaseModel):
    valid: bool
    discount: float
    message: str