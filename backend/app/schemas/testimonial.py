from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# Base Schema (shared fields)
class TestimonialBase(BaseModel):
    name: str
    description: str
    place: Optional[str] = None
    photo: Optional[str] = None
    display_order: int = 0
    status: bool = True


# Used for returning data
class Testimonial(TestimonialBase):
    id: int
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True   # If using Pydantic v2
        # orm_mode = True        # If using Pydantic v1
