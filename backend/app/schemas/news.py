from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class NewsBase(BaseModel):
    title: str
    slug: str
    content: str
    status: bool = True
    published_at: Optional[datetime] = None

class NewsCreate(NewsBase):
    pass

class NewsUpdate(NewsBase):
    title: Optional[str] = None
    slug: Optional[str] = None
    content: Optional[str] = None

class News(NewsBase):
    id: int
    feature_image: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    # In Pydantic V2, we use model_config instead of class Config
    model_config = ConfigDict(from_attributes=True)