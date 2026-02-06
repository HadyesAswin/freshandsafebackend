from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class BannerBase(BaseModel):
    image: str
    display_order: int = 0
    url: Optional[str] = None


class Banner(BannerBase):
    id: int

    class Config:
        from_attributes = True
