from pydantic import BaseModel, ConfigDict, EmailStr
from datetime import datetime
from typing import Optional

class OutletBase(BaseModel):
    outlet_name: str
    email: EmailStr
    phone: str
    address: str
    city: str
    district: str
    state: str
    zipcode: str
    landmark: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    status: bool = True

class OutletCreate(OutletBase):
    password: str # Plain password input

class OutletUpdate(OutletBase):
    password: Optional[str] = None # Optional for updates

class Outlet(OutletBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)