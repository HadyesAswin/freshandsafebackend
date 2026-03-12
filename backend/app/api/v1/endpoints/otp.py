from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import random
from app.schemas.otp import CompleteProfileRequest

from app.core.database import get_db
from app.models import User, UserRole
from app.schemas.otp import SendOTPRequest, VerifyOTPRequest
from app.core import security
from app.core.config import settings
from pydantic import BaseModel

router = APIRouter()


# ===============================
# 1️⃣ SEND OTP
# ===============================
@router.post("/send")
def send_otp(data: SendOTPRequest, db: Session = Depends(get_db)):

    phone = data.phone.strip()

    if len(phone) < 10:
        raise HTTPException(status_code=400, detail="Invalid phone number")

    user = db.query(User).filter(User.phone == phone).first()

    # Block non-customer accounts
    if user and user.role != UserRole.CUSTOMER:
        raise HTTPException(
            status_code=403,
            detail="OTP login not allowed for this account"
        )

    otp = str(random.randint(1000, 9999))
    expiry_time = datetime.utcnow() + timedelta(minutes=5)

    if user:
        user.reset_otp = otp
        user.reset_otp_expires_at = expiry_time
    else:
        user = User(
            phone=phone,
            role=UserRole.CUSTOMER,
            reset_otp=otp,
            reset_otp_expires_at=expiry_time,
            is_active=True
        )
        db.add(user)

    db.commit()

    print(f"\n\n📲 OTP for {phone} is: {otp}\n\n")

    return {"message": "OTP sent successfully"}


# ===============================
# 2️⃣ VERIFY OTP ONLY
# ===============================
@router.post("/verify")
def verify_otp(data: VerifyOTPRequest, db: Session = Depends(get_db)):

    phone = data.phone.strip()
    otp = data.otp.strip()

    user = db.query(User).filter(User.phone == phone).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    print("Entered Phone:", phone)
    print("Entered OTP:", otp)
    print("Stored OTP:", user.reset_otp)

    # Check OTP match
    if user.reset_otp != otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    # Check expiry
    if not user.reset_otp_expires_at or user.reset_otp_expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="OTP expired")

    # OTP valid → clear it
    user.reset_otp = None
    user.reset_otp_expires_at = None
    db.commit()

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    access_token = security.create_access_token(
        subject=str(user.id),
        expires_delta=access_token_expires,
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "phone": user.phone,
            "name": user.full_name,
            "email": user.email,
            "role": user.role
        }
    }



# ===============================
# 3️⃣ COMPLETE PROFILE
# ===============================
@router.post("/complete-profile")
def complete_profile(data: CompleteProfileRequest, db: Session = Depends(get_db)):

    phone = data.phone.strip()

    user = db.query(User).filter(User.phone == phone).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.role != UserRole.CUSTOMER:
        raise HTTPException(status_code=403, detail="Not allowed")

    if not data.name:
        raise HTTPException(status_code=400, detail="Name required")

    if not data.email:
        raise HTTPException(status_code=400, detail="Email required")

    # Check duplicate email
    existing_email = db.query(User).filter(User.email == data.email).first()
    if existing_email and existing_email.id != user.id:
        raise HTTPException(status_code=400, detail="Email already in use")

    user.full_name = data.name
    user.email = data.email

    db.commit()

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    access_token = security.create_access_token(
        subject=str(user.id),
        expires_delta=access_token_expires,
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {   
            "id": user.id,
            "phone": user.phone,
            "name": user.full_name,
            "email": user.email,
            "role": user.role
        }
    }


# ===============================
# 4️⃣ UPDATE SMS SUBSCRIPTION
# ===============================

class SMSSubscriptionRequest(BaseModel):
    user_id: int
    status: bool

@router.put("/update-sms-subscription")
def update_sms_subscription(payload: SMSSubscriptionRequest, db: Session = Depends(get_db)):
    """
    Updates the user's preference for SMS marketing and promotions.
    """
    user = db.query(User).filter(User.id == payload.user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Update the new field we added to the User model
    user.sms_subscription = payload.status
    db.commit()

    return {
        "status": "success",
        "message": "SMS Subscription updated successfully",
        "sms_subscription": user.sms_subscription
    }
