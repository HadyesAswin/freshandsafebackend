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

    # One Category -> Many Products
    products = relationship(
        "Product",
        back_populates="category",
        cascade="all, delete"
    )

  

class Certificate(Base):
    __tablename__ = "certificates"

    id = Column(Integer, primary_key=True, index=True)
    image = Column(String, nullable=False)
    display_order = Column(Integer, default=0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class Banner(Base):
    __tablename__ = "banners"

    id = Column(Integer, primary_key=True, index=True)
    image = Column(String, nullable=False)
    display_order = Column(Integer, default=0)
    url = Column(String, nullable=True)



class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)

    category_id = Column(
        Integer,
        ForeignKey("categories.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    name = Column(String, nullable=False, index=True)
    slug = Column(String, unique=True, nullable=False, index=True)

    description = Column(Text, nullable=True)
    image = Column(String, nullable=True)

    price = Column(Float, nullable=False)
    compare_price = Column(Float, nullable=True)

    unit = Column(String, nullable=True)

    is_available = Column(Boolean, default=True)
    status = Column(Boolean, default=True)

    meta_title = Column(String, nullable=True)
    meta_description = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Many Products -> One Category
    category = relationship(
        "Category",
        back_populates="products"
    )

    daily_deal = relationship("DailyDeal", back_populates="product", uselist=False, cascade="all, delete-orphan")


class TermsAndConditions(Base):
    __tablename__ = "terms_and_conditions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=False)

    status = Column(Boolean, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class RefundPolicy(Base):
    __tablename__ = "refund_policy"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=False)

    status = Column(Boolean, default=True)

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


class ContactInfo(Base):
    __tablename__ = "contact_info"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False) # e.g., "Main Office" or "Support Desk"
    email = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    description = Column(Text, nullable=True) # e.g., "Available 24/7" or Address info
    created_at = Column(DateTime, default=func.now())    

class DailyDeal(Base):
    __tablename__ = "daily_deals"

    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign Key linking to your Product table
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    offer_price = Column(Float, nullable=False) # The special deal price
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationship back to Product
    product = relationship("Product", back_populates="daily_deal")   


class Outlet(Base):
    __tablename__ = "outlets"

    id = Column(Integer, primary_key=True, index=True)
    outlet_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False) # We store the HASH, not plain text
    
    phone = Column(String, nullable=False)
    address = Column(String, nullable=False)
    city = Column(String, nullable=False)
    district = Column(String, nullable=False)
    state = Column(String, nullable=False)
    zipcode = Column(String, nullable=False)
    landmark = Column(String, nullable=True)
    
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    
    status = Column(Boolean, default=True) # Active/Inactive
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now()) 

    shop_products = relationship(
        "ShopProduct",
        back_populates="outlet",
        cascade="all, delete-orphan"
    )    


# Enum for Discount Type
class DiscountType(str, enum.Enum):
    PERCENTAGE = "percentage"
    FIXED = "fixed"

# Enum for Applicability
class ApplicableType(str, enum.Enum):
    ALL = "all"
    CATEGORY = "category"
    PRODUCT = "product"

# 1. Main Coupon Table
class Coupon(Base):
    __tablename__ = "coupons"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    
    discount_type = Column(String, default=DiscountType.FIXED) # 'percentage' or 'fixed'
    discount_value = Column(Float, nullable=False)
    
    min_order_amount = Column(Float, default=0.0)
    max_discount_amount = Column(Float, nullable=True) # Max cap for percentage
    
    total_usage_limit = Column(Integer, nullable=True)
    usage_limit_per_user = Column(Integer, default=1)
    used_count = Column(Integer, default=0)
    
    valid_from = Column(DateTime, nullable=False)
    valid_to = Column(DateTime, nullable=False)
    
    # "all", "category", "product"
    applicable_type = Column(String, default=ApplicableType.ALL) 
    
    status = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    categories = relationship("CouponCategory", back_populates="coupon", cascade="all, delete-orphan")
    products = relationship("CouponProduct", back_populates="coupon", cascade="all, delete-orphan")

# 2. Association Table: Coupon -> Categories
class CouponCategory(Base):
    __tablename__ = "coupon_categories"
    id = Column(Integer, primary_key=True, index=True)
    coupon_id = Column(Integer, ForeignKey("coupons.id", ondelete="CASCADE"))
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="CASCADE"))
    
    coupon = relationship("Coupon", back_populates="categories")
    # We assume Category model exists
    category = relationship("Category") 

# 3. Association Table: Coupon -> Products
class CouponProduct(Base):
    __tablename__ = "coupon_products"
    id = Column(Integer, primary_key=True, index=True)
    coupon_id = Column(Integer, ForeignKey("coupons.id", ondelete="CASCADE"))
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"))
    
    coupon = relationship("Coupon", back_populates="products")
    # We assume Product model exists
    product = relationship("Product")

# 4. Usage Table (For tracking history)
class CouponUsage(Base):
    __tablename__ = "coupon_usage"
    id = Column(Integer, primary_key=True, index=True)
    coupon_id = Column(Integer, ForeignKey("coupons.id"))
    user_id = Column(Integer, ForeignKey("users.id")) # user table is "user" (singular) usually
    order_id = Column(Integer, nullable=True) # Link to order if you have one
    discount_amount = Column(Float, nullable=False)
    used_at = Column(DateTime(timezone=True), server_default=func.now())    


class ShopProduct(Base):
    __tablename__ = "shop_products"

    id = Column(Integer, primary_key=True, index=True)

    # Foreign Key → Outlet (Shop)
    outlet_id = Column(
        Integer,
        ForeignKey("outlets.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Foreign Key → Product
    product_id = Column(
        Integer,
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Availability of product in this specific shop
    is_available = Column(Boolean, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    outlet = relationship("Outlet", back_populates="shop_products")
    product = relationship("Product")

class Zipcode(Base):
    __tablename__ = "zipcodes"

    id = Column(Integer, primary_key=True, index=True)
    zipcode = Column(String, unique=True, index=True, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
