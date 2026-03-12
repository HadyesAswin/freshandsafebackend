from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api import deps
from app.core.database import get_db
from app.models import User

# ✅ NEW IMPORTS for Password Change
from app.core.security import verify_password, get_password_hash
from app.schemas.admin import AdminChangePassword 

router = APIRouter()

# --- Existing Endpoint ---
@router.get("/", response_model=None)
def read_users(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    users = db.query(User).offset(skip).limit(limit).all()
    return [{"id": u.id,"email": u.email, "role": u.role} for u in users]


# --- ✅ NEW Endpoint: Change Admin Password ---
@router.post("/change-password")
def change_admin_password(
    password_data: AdminChangePassword,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Change password for the currently logged-in Admin.
    """
    # 1. Check if new passwords match
    if password_data.new_password != password_data.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password and confirm password do not match"
        )

    # 2. Verify Old Password
    if not verify_password(password_data.old_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect old password"
        )

    # 3. Hash & Update
    current_user.hashed_password = get_password_hash(password_data.new_password)
    
    db.add(current_user)
    db.commit()
    db.refresh(current_user)

    return {"message": "Password updated successfully"}