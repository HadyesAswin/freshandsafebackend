from sqlalchemy import Boolean, Column, Integer, String, Enum as PgEnum, DateTime, Text, ForeignKey, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum

# 1. Define your roles strictly
class UserRole(str, enum.Enum):
    ADMIN = "admin"
    OUTLET = "outlet"
    CUSTOMER = "customer"

# 2. Define the User class (Ensure 'User' is capitalized)
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    
    role = Column(PgEnum(UserRole), default=UserRole.CUSTOMER, nullable=False)
    
    is_active = Column(Boolean(), default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    slug = Column(String, unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    image = Column(String, nullable=True)
    display_order = Column(Integer, default=0)
    status = Column(Boolean, default=True)
    
    # Relationship: One Category -> Many Products
  

class Certificate(Base):
    __tablename__ = "certificates"

    id = Column(Integer, primary_key=True, index=True)
    image = Column(String, nullable=False)
    display_order = Column(Integer, default=0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())