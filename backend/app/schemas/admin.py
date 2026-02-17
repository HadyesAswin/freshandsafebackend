from pydantic import BaseModel, constr

# Class specifically for Admin Password Change
class AdminChangePassword(BaseModel):
    old_password: str
    new_password: constr(min_length=6) # type: ignore
    confirm_password: str