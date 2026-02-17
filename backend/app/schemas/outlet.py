from pydantic import BaseModel, ConfigDict, EmailStr
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, constr

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


class OutletChangePassword(BaseModel):
    old_password: str
    new_password: constr(min_length=6) # type: ignore # Enforce minimum length
    confirm_password: str


# 1. Schema for UPDATING profile (What the user sends)
class OutletUpdateProfile(BaseModel):
    outlet_name: str
    phone: str
    address: str
    city: str
    district: str
    state: str
    zipcode: str
    landmark: Optional[str] = None

# 2. Schema for VIEWING profile (What the API returns)
class OutletProfileResponse(OutletUpdateProfile):
    id: int
    email: EmailStr
    status: bool

    class Config:
        from_attributes = True # Allows Pydantic to read SQLAlchemy models



class OutletStatusUpdate(BaseModel):
    status: bool
