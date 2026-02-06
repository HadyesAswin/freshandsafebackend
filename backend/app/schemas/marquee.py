from pydantic import BaseModel, ConfigDict
from datetime import datetime

class MarqueeBase(BaseModel):
    text: str

class MarqueeCreate(MarqueeBase):
    pass

class Marquee(MarqueeBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)