from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.api import deps
from app.core import security
from app.core.config import settings  # <--- IMPORT SETTINGS
from app.core.database import get_db
from app.models import User, Outlet
from app.schemas.token import Token
from jose import jwt

router = APIRouter()

@router.post("/login/access-token", response_model=Token)
def login_access_token(
    db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    # 1. Check if user exists and password is correct
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Incorrect email or password"
        )
    
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    # 2. Calculate Expiration
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    # 3. Create Token
    return {
        "access_token": security.create_access_token(
            subject=user.id, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }


@router.post("/login/outlet-access-token", response_model=Token)
def login_outlet_access_token(
    db: Session = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends(),
) -> Any:
    """
    OAuth2 compatible token login for outlets.
    Returns JWT access token for outlet dashboard.
    """

    # 1️⃣ Find outlet
    outlet = db.query(Outlet).filter(
        Outlet.email == form_data.username
    ).first()

    # 2️⃣ Validate credentials
    if not outlet or not security.verify_password(
        form_data.password, outlet.hashed_password
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password",
        )

    # 3️⃣ Check active status
    if not outlet.status:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Outlet is inactive",
        )

    # 4️⃣ Token expiration
    access_token_expires = timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )

    # 5️⃣ Create token
    access_token = security.create_access_token(
        subject=str(outlet.id),
        expires_delta=access_token_expires,
    )

    # 6️⃣ Verify token contains outlet ID
    try:
        decoded = jwt.decode(
            access_token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        if "sub" not in decoded:
            raise HTTPException(
                status_code=500,
                detail="Outlet ID not stored in token",
            )
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Token validation failed",
        )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "outlet_id": outlet.id,
    }