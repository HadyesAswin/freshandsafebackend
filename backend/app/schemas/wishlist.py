from pydantic import BaseModel
from typing import List

class WishlistSyncRequest(BaseModel):
    user_id: int
    product_ids: List[int]