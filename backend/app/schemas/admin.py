from pydantic import BaseModel, constr
from typing import List, Union, Any

# Class specifically for Admin Password Change
class AdminChangePassword(BaseModel):
    old_password: str
    new_password: constr(min_length=6) # type: ignore
    confirm_password: str


class StockUpdateItem(BaseModel):
    # ✅ Change 'int' to 'Any' or 'Union[int, str]' so it accepts "new_12"
    shop_product_id: Any 
    new_stock: int

class BulkStockUpdateRequest(BaseModel):
    updates: List[StockUpdateItem]    