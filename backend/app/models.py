from sqlalchemy import Boolean, Column, Integer, String, Enum as PgEnum, DateTime, Text, ForeignKey, Float, JSON
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

    email = Column(String, unique=True, index=True, nullable=True)
    phone = Column(String, unique=True, index=True, nullable=False)

    hashed_password = Column(String, nullable=True)

    role = Column(
        PgEnum(UserRole, values_callable=lambda enum_cls: [e.value for e in enum_cls]),
        default=UserRole.CUSTOMER,
        nullable=False
    )

    reset_otp = Column(String, nullable=True)
    reset_otp_expires_at = Column(DateTime, nullable=True)

    sms_subscription = Column(Boolean(), default=False)

    is_active = Column(Boolean(), default=True)
    is_deleted = Column(Boolean, default=False) # ✅ ADDED FOR SOFT DELETE
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
    is_deleted = Column(Boolean, default=False) # ✅ ADDED FOR SOFT DELETE

    meta_title = Column(String, nullable=True)
    meta_description = Column(Text, nullable=True)

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
    
    # ✅ Kept for backward compatibility (serves as the primary/thumbnail image)
    image = Column(String, nullable=True) 
    # ✅ ADDED FOR MULTIPLE IMAGES
    images = Column(JSON, default=list) 

    price = Column(Float, nullable=False)
    compare_price = Column(Float, nullable=True)

    unit = Column(String, nullable=True)

    is_available = Column(Boolean, default=True)
    status = Column(Boolean, default=True)
    is_deleted = Column(Boolean, default=False) 

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
    is_deleted = Column(Boolean, default=False) # ✅ ADDED FOR SOFT DELETE
    
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
    is_deleted = Column(Boolean, default=False) # ✅ ADDED FOR SOFT DELETE
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
    coupon_id = Column(Integer, ForeignKey("coupons.id", ondelete="CASCADE"))
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

    stock = Column(Integer, default=0, nullable=False) 
    low_stock_threshold = Column(Integer, default=5, nullable=False)

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


class OrderStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PREPARING = "preparing"
    READY_FOR_PICKUP = "ready_for_pickup"
    OUT_FOR_DELIVERY = "out_for_delivery"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    PAID = "paid"
    FAILED = "failed"

class PaymentMethod(str, enum.Enum):
    ONLINE = "online"


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String, unique=True, index=True, nullable=False)

    # Relationships (Who ordered it, and from which shop?)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True) # Nullable for guest checkout
    outlet_id = Column(Integer, ForeignKey("outlets.id"), nullable=False, index=True)

    # Customer Info Snapshot
    customer_name = Column(String, nullable=False)
    customer_phone = Column(String, nullable=False)
    customer_email = Column(String, nullable=True)

    # Delivery Info Snapshot
    delivery_name = Column(String, nullable=False)
    delivery_phone = Column(String, nullable=False)
    delivery_address_line1 = Column(String, nullable=False)
    delivery_address_line2 = Column(String, nullable=True)
    delivery_city = Column(String, nullable=False)
    delivery_state = Column(String, nullable=False)
    delivery_zipcode = Column(String, nullable=False)
    
    # Coordinates (For QWQER later)
    delivery_latitude = Column(Float, nullable=True)
    delivery_longitude = Column(Float, nullable=True)

    # Financials
    subtotal = Column(Float, default=0.0)
    discount_amount = Column(Float, default=0.0)
    tax_amount = Column(Float, default=0.0)
    delivery_fee = Column(Float, default=0.0)
    total_amount = Column(Float, nullable=False)

    # Meta
    coupon_code = Column(String, nullable=True)
    
    order_status = Column(
        PgEnum(OrderStatus, values_callable=lambda obj: [e.value for e in obj]), 
        default=OrderStatus.PENDING
    )
    payment_status = Column(
        PgEnum(PaymentStatus, values_callable=lambda obj: [e.value for e in obj]), 
        default=PaymentStatus.PENDING
    )
    payment_method = Column(String, default=PaymentMethod.ONLINE)

    razorpay_order_id = Column(String, nullable=True)
    razorpay_payment_id = Column(String, nullable=True)
    razorpay_signature = Column(String, nullable=True)
    
    customer_note = Column(Text, nullable=True)

    # QWQER Integration Fields (Ready for later)
    qwqer_order_id = Column(String, nullable=True)
    qwqer_status = Column(String, nullable=True)
    qwqer_tracking_url = Column(String, nullable=True)
    qwqer_driver_name = Column(String, nullable=True)
    qwqer_driver_phone = Column(String, nullable=True)
    qwqer_assigned_at = Column(DateTime, nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    confirmed_at = Column(DateTime(timezone=True), nullable=True)
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    delivery_house_number = Column(String, nullable=True)

    # Relationships
    user = relationship("User", backref="orders")
    outlet = relationship("Outlet", backref="orders")
    
    # One Order -> Many Items
    order_items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)

    quantity = Column(Integer, nullable=False)
    price_per_unit = Column(Float, nullable=False) # MUST capture price at time of order
    total_price = Column(Float, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    order = relationship("Order", back_populates="order_items")
    product = relationship("Product")


class UserAddress(Base):
    __tablename__ = "user_addresses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # ✅ NEW: Contact details specific to this address
    name = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    email = Column(String, nullable=True)

    address_line1 = Column(String, nullable=False)
    address_line2 = Column(String, nullable=True)
    city = Column(String, nullable=False)
    state = Column(String, nullable=False)
    zipcode = Column(String, nullable=False)

    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship back to User
    user = relationship("User", backref="addresses")


class Cart(Base):
    __tablename__ = "carts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationship
    user = relationship("User", backref="cart")
    items = relationship("CartItem", back_populates="cart", cascade="all, delete-orphan")

class CartItem(Base):
    __tablename__ = "cart_items"

    id = Column(Integer, primary_key=True, index=True)
    cart_id = Column(Integer, ForeignKey("carts.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    
    quantity = Column(Integer, default=1)

    # Relationships
    cart = relationship("Cart", back_populates="items")
    product = relationship("Product")    
class Testimonial(Base):
    __tablename__ = "testimonials"

    id = Column(Integer, primary_key=True, index=True)
    
    photo = Column(String, nullable=True)   # Image URL or file path
    name = Column(String, nullable=False)   # Person's name
    description = Column(Text, nullable=False)  # Testimonial content
    place = Column(String, nullable=True)   # City / Location
    
    display_order = Column(Integer, default=0)
    status = Column(Boolean, default=True)  # Active / Inactive
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class Wishlist(Base):
    __tablename__ = "wishlists"

    id = Column(Integer, primary_key=True, index=True)
    # ondelete="CASCADE" means if a user or product is deleted, the wishlist item is also deleted
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())  


class Blog(Base):
    __tablename__ = "blogs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    slug = Column(String, unique=True, index=True, nullable=False)
    content = Column(Text, nullable=False)
    feature_image = Column(String, nullable=True)
    author = Column(String, default="Fresh & Safe Team") # New for blogs
    status = Column(Boolean, default=True) # True = Published, False = Draft
    
    published_at = Column(DateTime, default=func.now())
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())


class SearchTrend(Base):
    __tablename__ = "search_trends"

    id = Column(Integer, primary_key=True, index=True)
    term = Column(String, unique=True, index=True, nullable=False)
    count = Column(Integer, default=1)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())    