from pydantic import BaseModel, ConfigDict, EmailStr
from datetime import datetime
from typing import Optional

class ContactBase(BaseModel):
    title: str
    email: EmailStr
    phone: str
    description: Optional[str] = None

class ContactCreate(ContactBase):
    pass

class Contact(ContactBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)