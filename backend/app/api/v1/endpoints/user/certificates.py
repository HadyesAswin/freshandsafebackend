from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
# Make sure to import your actual Certificate model!
from app.models import Certificate 

router = APIRouter()

# =====================================================
# PUBLIC: GET ALL ACTIVE CERTIFICATES
# =====================================================
@router.get("/certificates")
def get_public_certificates(db: Session = Depends(get_db)):
    try:
        # Fetch all certificates, ordered by your display_order column
        certificates = db.query(Certificate).order_by(Certificate.display_order.asc()).all()

        # Return only the fields that actually exist in your database
        return [
            {
                "id": cert.id,
                "image": cert.image
            }
            for cert in certificates
        ]
    except Exception as e:
        import traceback
        print("Error fetching certificates:", traceback.format_exc())
        raise HTTPException(status_code=500, detail="Failed to load certificates")