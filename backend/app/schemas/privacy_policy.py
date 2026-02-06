from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class PrivacyPolicyBase(BaseModel):
    title: str
    description: str
    display_order: int = 0
    status: bool = True

class PrivacyPolicyCreate(PrivacyPolicyBase):
    pass

class PrivacyPolicy(PrivacyPolicyBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)