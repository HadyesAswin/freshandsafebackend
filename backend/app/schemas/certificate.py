from datetime import datetime
from pydantic import BaseModel, ConfigDict


class CertificateBase(BaseModel):
    image: str
    display_order: int


class Certificate(CertificateBase):
    id: int
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)