from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# Shared properties (Used for both reading and writing)
class CategoryBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    image: Optional[str] = None
    display_order: int = 0
    status: bool = True

# What the API expects when you CREATE a category
class CategoryCreate(CategoryBase):
    pass

# What the API returns to the Frontend
class Category(CategoryBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True