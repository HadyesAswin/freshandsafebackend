from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Outlet
from app.schemas.outlet import OutletChangePassword
# Make sure you have these security utils. If not, let me know!
from app.core.security import verify_password, get_password_hash 
from app.dependencies import get_current_outlet 
from app.schemas.outlet import OutletChangePassword, OutletUpdateProfile, OutletProfileResponse
from app.schemas.outlet import OutletStatusUpdate

router = APIRouter()

# --- Change Password Endpoint ---
@router.post("/change-password")
def change_outlet_password(
    password_data: OutletChangePassword,
    db: Session = Depends(get_db),
    current_outlet: Outlet = Depends(get_current_outlet) # extracts outlet from token
):
    # 1. Verify Passwords Match
    if password_data.new_password != password_data.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password and confirm password do not match"
        )

    # 2. Verify Old Password
    if not verify_password(password_data.old_password, current_outlet.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect old password"
        )

    # 3. Hash New Password and Update
    current_outlet.hashed_password = get_password_hash(password_data.new_password)
    
    db.add(current_outlet)
    db.commit()
    db.refresh(current_outlet)

    return {"message": "Password updated successfully"}


# --- 1. GET Profile Endpoint ---
@router.get("/profile", response_model=OutletProfileResponse)
def get_outlet_profile(
    current_outlet: Outlet = Depends(get_current_outlet)
):
    """Fetch the currently logged-in outlet's profile."""
    return current_outlet

# --- 2. UPDATE Profile Endpoint ---
@router.put("/profile", response_model=OutletProfileResponse)
def update_outlet_profile(
    profile_data: OutletUpdateProfile,
    db: Session = Depends(get_db),
    current_outlet: Outlet = Depends(get_current_outlet)
):
    """Update outlet details (excluding email/password)."""
    
    # Update fields dynamically
    # This loops through the data sent (phone, address, etc.) and updates the DB object
    for key, value in profile_data.dict().items():
        setattr(current_outlet, key, value)

    db.add(current_outlet)
    db.commit()
    db.refresh(current_outlet)
    
    return current_outlet


@router.put("/status")
def update_outlet_status(
    status_data: OutletStatusUpdate,
    db: Session = Depends(get_db),
    current_outlet: Outlet = Depends(get_current_outlet)
):
    """Toggle the shop Open/Closed status."""
    current_outlet.status = status_data.status
    db.add(current_outlet)
    db.commit()
    db.refresh(current_outlet)
    
    return {
        "status": current_outlet.status, 
        "message": f"Shop is now {'OPEN' if current_outlet.status else 'CLOSED'}"
    }