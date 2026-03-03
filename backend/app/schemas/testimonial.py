from pydantic import BaseModel, ConfigDict
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

    model_config = ConfigDict(from_attributes=True)