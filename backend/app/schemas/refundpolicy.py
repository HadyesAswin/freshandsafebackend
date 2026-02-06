from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# Shared properties (used for both reading & writing)
class RefundPolicyBase(BaseModel):
    title: str
    description: str
    status: bool = True


# What the API expects when CREATING refund policy
class RefundPolicyCreate(RefundPolicyBase):
    pass


# For UPDATE operations
class RefundPolicyUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[bool] = None


# What the API returns to the Frontend
class RefundPolicy(RefundPolicyBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
