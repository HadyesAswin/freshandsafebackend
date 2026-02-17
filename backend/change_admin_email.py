from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models import User

def update_admin_email():
    db = SessionLocal()
    
    # 1. The old placeholder email
    OLD_EMAIL = "admin@freshtohome.com"
    
    # 2. YOUR REAL EMAIL (Change this!)
    NEW_EMAIL = "etournament49@gmail.com"  # <--- REPLACE THIS WITH YOUR REAL EMAIL
    
    # 3. Find the user
    user = db.query(User).filter(User.email == OLD_EMAIL).first()
    
    if user:
        print(f"Found user with email: {OLD_EMAIL}")
        # Update to new email
        user.email = NEW_EMAIL
        db.commit()
        print(f"✅ Success! Admin email changed to: {NEW_EMAIL}")
    else:
        print(f"❌ Could not find any user with email: {OLD_EMAIL}")
        
        # Check if the new email already exists
        new_user = db.query(User).filter(User.email == NEW_EMAIL).first()
        if new_user:
            print(f"⚠️ Good news: A user with {NEW_EMAIL} already exists. You can just login!")

    db.close()

if __name__ == "__main__":
    update_admin_email()