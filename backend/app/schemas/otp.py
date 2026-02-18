from pydantic import BaseModel
from typing import Optional

class SendOTPRequest(BaseModel):
    phone: str

class VerifyOTPRequest(BaseModel):
    phone: str
    otp: str
    name: Optional[str] = None
    email: Optional[str] = None

class CompleteProfileRequest(BaseModel):
    phone: str
    name: str
    email: str