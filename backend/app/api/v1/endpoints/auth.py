from datetime import timedelta, datetime
from typing import Any
import random

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core import security
from app.core.config import settings
from app.core.database import get_db
from app.models import User, Outlet
from app.schemas.token import Token

# NEW IMPORTS for Forgot Password
from app.schemas.token import ForgotPasswordRequest, ResetPasswordRequest
from app.core.security import get_password_hash

router = APIRouter()

# --- 1. Admin/User Login ---
@router.post("/login/access-token", response_model=Token)
def login_access_token(
    db: Session = Depends(get_db), 
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests.
    Used for Admin and Customers.
    """
    user = db.query(User).filter(User.email == form_data.username).first()
    if (
        not user
        or not user.hashed_password
        or not security.verify_password(form_data.password, user.hashed_password)
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Incorrect email or password"
        )
    
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    # Standardize 'sub' as a string to match dependency lookup
    return {
        "access_token": security.create_access_token(
            subject=str(user.id), expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }


# --- 2. Outlet Login ---
@router.post("/login/outlet-access-token", response_model=Token)
def login_outlet_access_token(
    db: Session = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends(),
) -> Any:
    """
    Standardized Outlet Login.
    Queries the Outlets table and returns a token specifically for the Outlet Dashboard.
    """
    # 1. Verify against Outlet table
    outlet = db.query(Outlet).filter(Outlet.email == form_data.username).first()

    if not outlet or not security.verify_password(form_data.password, outlet.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password",
        )

    if not outlet.status:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Outlet is inactive"
        )

    # 2. Create token - subject MUST be a string to avoid 403 lookup errors
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        subject=str(outlet.id),
        expires_delta=access_token_expires,
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }


# --- 3. Forgot Password (Request OTP) ---
@router.post("/login/forgot-password")
def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Generates a 6-digit OTP for User password reset.
    """
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        # Security best practice: don't confirm if email exists to prevent enumeration
        return {"message": "If this email exists, an OTP has been sent."}

    otp = f"{random.randint(100000, 999999)}"
    user.reset_otp = otp
    user.reset_otp_expires_at = datetime.utcnow() + timedelta(minutes=10)
    db.commit()

    # Simulation: Print to console instead of sending real email
    print("========================================")
    print(f"📧 EMAIL TO: {user.email}")
    print(f"🔑 RESET OTP: {otp}")
    print("========================================")
    
    return {"message": "OTP sent to your email."}


# --- 4. Reset Password (Verify OTP) ---
@router.post("/login/reset-password")
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    """
    Verifies OTP and updates User password.
    """
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid request")

    if not user.reset_otp or user.reset_otp != request.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    if user.reset_otp_expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="OTP has expired")

    if request.new_password != request.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")

    user.hashed_password = get_password_hash(request.new_password)
    user.reset_otp = None
    user.reset_otp_expires_at = None
    db.commit()

    return {"message": "Password reset successfully. Please login with your new password."}