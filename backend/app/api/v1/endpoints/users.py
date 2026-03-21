from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api import deps
from app.core.database import get_db
from app.models import User
from app.schemas.user import UserUpdate

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





# --- 2. Update Endpoint ---
@router.put("/{user_id}")
def update_user_details(
    user_id: int, 
    user_data: UserUpdate, 
    db: Session = Depends(get_db)
):
    """
    Update a user's name or email. Phone number cannot be changed.
    """
    # Find the user
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # ✅ FIX: Map the frontend "name" variable to the database "full_name" column
    if user_data.name is not None:
        user.full_name = user_data.name
        
    if user_data.email is not None:
        # Check if email is already taken by someone else
        existing_email = db.query(User).filter(User.email == user_data.email, User.id != user_id).first()
        if existing_email:
             raise HTTPException(status_code=400, detail="Email is already registered to another account")
        user.email = user_data.email
        
    # Save to database permanently
    db.commit()
    db.refresh(user)
    
    # Return fresh user object, mapping "full_name" back to "name" for the frontend localStorage
    return {
        "id": user.id,
        "name": user.full_name, # ✅ CRITICAL: Send it back as 'name'
        "email": user.email,
        "phone": user.phone,
        "role": user.role.value if hasattr(user.role, 'value') else user.role, # Safely handle the Enum
        "sms_subscription": getattr(user, 'sms_subscription', False),
        "is_active": user.is_active,
    }