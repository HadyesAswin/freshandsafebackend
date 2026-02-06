from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class FAQBase(BaseModel):
    question: str
    answer: str
    display_order: int = 0
    status: bool = True

class FAQCreate(FAQBase):
    pass

class FAQ(FAQBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)