from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Outlet
from app.core.config import settings  # <--- ✅ CRITICAL FIX: Use the same settings as auth.py

# 1. Configuration 
# We fetch these from settings so they match your Login system perfectly.
SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.ALGORITHM

# 2. Define where the token comes from
# This URL must match the path in your router for outlet login
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/login/outlet-access-token")

# 3. The Main Dependency Function
def get_current_outlet(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Decode the token using the SAME key as the login file
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        # Get the ID (sub) from the token
        outlet_id: str = payload.get("sub")
        
        if outlet_id is None:
            raise credentials_exception
            
    except JWTError:
        raise credentials_exception

    # Find the outlet in the database
    # Login converts ID to string, so we convert back or let SQLAlchemy handle it
    outlet = db.query(Outlet).filter(Outlet.id == outlet_id).first()
    
    if outlet is None:
        raise credentials_exception
        
    return outlet