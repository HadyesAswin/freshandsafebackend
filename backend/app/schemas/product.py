from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# Shared properties (used for both reading & writing)
class ProductBase(BaseModel):
    category_id: int
    name: str
    slug: str
    description: Optional[str] = None
    image: Optional[str] = None
    images: Optional[List[str]] = []

    price: float
    compare_price: Optional[float] = None
    unit: Optional[str] = None

    is_available: bool = True
    status: bool = True

    meta_title: Optional[str] = None
    meta_description: Optional[str] = None


# What the API expects when CREATING a product
class ProductCreate(ProductBase):
    pass


# (Optional but recommended) For UPDATE operations
class ProductUpdate(BaseModel):
    category_id: Optional[int] = None
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    image: Optional[str] = None

    price: Optional[float] = None
    compare_price: Optional[float] = None
    unit: Optional[str] = None

    is_available: Optional[bool] = None
    status: Optional[bool] = None

    meta_title: Optional[str] = None
    meta_description: Optional[str] = None


# What the API returns to the Frontend
class Product(ProductBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
