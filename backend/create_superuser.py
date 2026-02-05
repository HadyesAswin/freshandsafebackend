from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.user import User, UserRole
from app.core.security import get_password_hash

def create_superuser():
    db: Session = SessionLocal()
    
    # 1. Check if an admin already exists
    existing_admin = db.query(User).filter(User.email == "admin@freshtohome.com").first()
    if existing_admin:
        print("Admin user already exists!")
        return

    # 2. Create the new Admin
    print("Creating Superuser...")
    super_user = User(
        full_name="Super Admin",
        email="admin@freshtohome.com",
        hashed_password=get_password_hash("admin123"), # Default password
        role=UserRole.ADMIN,
        is_active=True
    )
    
    db.add(super_user)
    db.commit()
    print("Superuser created successfully!")
    print("Email: admin@freshtohome.com")
    print("Password: admin123")
    db.close()

if __name__ == "__main__":
    create_superuser()