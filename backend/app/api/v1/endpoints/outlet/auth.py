from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models import Outlet

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/login/outlet-access-token"
)

def get_current_outlet(
    db: Session = Depends(get_db), 
    token: str = Depends(reusable_oauth2)
) -> Outlet:
    try:
        # FIX: Access ALGORITHM via settings
        payload = jwt.decode(
            token, 
            settings.SECRET_KEY, 
            algorithms=[settings.ALGORITHM]
        )
        outlet_id: str = payload.get("sub")
        if outlet_id is None:
            raise HTTPException(status_code=403, detail="Invalid token payload")
    except (JWTError, AttributeError) as e:
        # This catch-all handles the crash you saw in the logs
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )

    # Standard database lookup
    # ✅ SOFT DELETE FILTER APPLIED HERE: Bans deleted stores automatically!
    outlet = None
    if str(outlet_id).isdigit():
        outlet = db.query(Outlet).filter(Outlet.id == int(outlet_id), Outlet.is_deleted == False).first()
    else:
        outlet = db.query(Outlet).filter(Outlet.email == str(outlet_id), Outlet.is_deleted == False).first()
    
    if not outlet:
        raise HTTPException(status_code=403, detail="Outlet not found or has been removed")
        
    return outlet