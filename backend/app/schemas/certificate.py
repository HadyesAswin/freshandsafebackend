from datetime import datetime
from pydantic import BaseModel


class CertificateBase(BaseModel):
    image: str
    display_order: int


class Certificate(CertificateBase):
    id: int
    created_at: datetime
    updated_at: datetime | None = None

    class Config:
        orm_mode = True
