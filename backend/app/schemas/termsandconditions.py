from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# Shared properties (used for both reading & writing)
class TermsAndConditionsBase(BaseModel):
    title: str
    description: str
    status: bool = True


# What the API expects when CREATING terms
class TermsAndConditionsCreate(TermsAndConditionsBase):
    pass


# (Optional but recommended) For UPDATE operations
class TermsAndConditionsUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[bool] = None


# What the API returns to the Frontend
class TermsAndConditions(TermsAndConditionsBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
