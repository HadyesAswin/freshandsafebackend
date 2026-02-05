from typing import Optional
from pydantic import BaseModel

# What the server sends to the user after login
class Token(BaseModel):
    access_token: str
    token_type: str

# What is INSIDE the token (the hidden payload)
class TokenPayload(BaseModel):
    sub: Optional[int] = None