from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

# Mini-schema to show Product details inside the Deal response
class ProductMini(BaseModel):
    id: int
    name: str
    price: float
    image: Optional[str] = None
    slug: str

class DailyDealBase(BaseModel):
    product_id: int
    offer_price: float

class DailyDealCreate(DailyDealBase):
    pass

class DailyDeal(DailyDealBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    product: Optional[ProductMini] = None # Nested product data

    model_config = ConfigDict(from_attributes=True)