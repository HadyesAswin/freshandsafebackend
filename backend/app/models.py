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


class News(Base):
    __tablename__ = "news"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    slug = Column(String, unique=True, index=True, nullable=False)
    content = Column(Text, nullable=False)
    feature_image = Column(String, nullable=True)
    status = Column(Boolean, default=True) # True = Published, False = Draft
    published_at = Column(DateTime, default=func.now())
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())


class FAQ(Base):
    __tablename__ = "faqs"

    id = Column(Integer, primary_key=True, index=True)
    question = Column(String, nullable=False)
    answer = Column(Text, nullable=False)
    display_order = Column(Integer, default=0)
    status = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())  

class PrivacyPolicy(Base):
    __tablename__ = "privacy_policies"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False) # For the policy content
    display_order = Column(Integer, default=0)
    status = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())     

class Marquee(Base):
    __tablename__ = "marquees"

    id = Column(Integer, primary_key=True, index=True)
    text = Column(String, nullable=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())     