from typing import Optional
from pydantic import BaseModel
from pydantic import BaseModel, EmailStr

# What the server sends to the user after login
class Token(BaseModel):
    access_token: str
    token_type: str

# What is INSIDE the token (the hidden payload)
class TokenPayload(BaseModel):
    sub: Optional[int] = None


class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str
    new_password: str
    confirm_password: str