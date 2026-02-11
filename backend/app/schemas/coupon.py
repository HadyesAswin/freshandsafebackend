from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import List, Optional

# --- Input Schemas ---
class CouponBase(BaseModel):
    code: str
    description: Optional[str] = None
    discount_type: str = "fixed" # "percentage" or "fixed"
    discount_value: float
    min_order_amount: float = 0
    max_discount_amount: Optional[float] = None
    total_usage_limit: Optional[int] = None
    usage_limit_per_user: int = 1
    valid_from: datetime
    valid_to: datetime
    applicable_type: str = "all" # "all", "category", "product"
    status: bool = True

class CouponCreate(CouponBase):
    # We receive lists of IDs (e.g., [1, 2, 5])
    category_ids: List[int] = [] 
    product_ids: List[int] = []

class CouponUpdate(CouponBase):
    category_ids: Optional[List[int]] = None
    product_ids: Optional[List[int]] = None

# --- Output Schemas ---
# Mini schemas for nested display
class CategoryMini(BaseModel):
    id: int
    name: str

class ProductMini(BaseModel):
    id: int
    name: str

class CouponCategoryOut(BaseModel):
    category: CategoryMini
class CouponProductOut(BaseModel):
    product: ProductMini

class Coupon(CouponBase):
    id: int
    used_count: int
    created_at: datetime
    
    # Return full details for display
    categories: List[CouponCategoryOut] = []
    products: List[CouponProductOut] = []

    model_config = ConfigDict(from_attributes=True)