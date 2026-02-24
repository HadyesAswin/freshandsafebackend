from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth, users, categories, certificates, banners, products, 
    termsandconditions, refundpolicy, news, faq, privacy, 
    marquee, contact, daily_deals, outlets, coupons, 
    location_products, public_coupons, otp, orders, 
    cart, admin, sales, dashboard, testimonials
)
# Specialized Outlet Endpoints
from app.api.v1.endpoints.outlet import outletviewproduct
from app.api.v1.endpoints.outlet import orders as outlet_orders

api_router = APIRouter()

# 1. Base Authentication & Users
api_router.include_router(auth.router, tags=["login"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(otp.router, prefix="/otp", tags=["OTP"])

# 2. Global Catalog & Content
api_router.include_router(categories.router, prefix="/categories", tags=["categories"])
api_router.include_router(products.router, prefix="/products", tags=["Products"])
api_router.include_router(banners.router, prefix="/banners", tags=["Banners"])
api_router.include_router(certificates.router, prefix="/certificates", tags=["Certificates"])
api_router.include_router(daily_deals.router, prefix="/daily-deals", tags=["daily-deals"])

# 3. Location & Shop Management
api_router.include_router(outlets.router, prefix="/outlets", tags=["outlets"])
api_router.include_router(location_products.router, prefix="/location-products", tags=["Location Products"])

# 4. Marketing & Legal
api_router.include_router(coupons.router, prefix="/coupons", tags=["coupons"])
api_router.include_router(public_coupons.router, prefix="/public-coupons", tags=["Public Coupons"])
api_router.include_router(termsandconditions.router, prefix="/termsandconditions", tags=["Terms & Conditions"])
api_router.include_router(refundpolicy.router, prefix="/refund-policy", tags=["Refund Policy"])
api_router.include_router(privacy.router, prefix="/privacy", tags=["privacy"])
api_router.include_router(news.router, prefix="/news", tags=["news"])
api_router.include_router(faq.router, prefix="/faq", tags=["faq"])
api_router.include_router(marquee.router, prefix="/marquee", tags=["marquee"])
api_router.include_router(contact.router, prefix="/contact", tags=["contact"])
api_router.include_router(testimonials.router, prefix="/testimonials", tags=["Testimonials"])

# 5. Customer Operations
api_router.include_router(cart.router, prefix="/cart", tags=["Cart"])
api_router.include_router(orders.router, prefix="/orders", tags=["Orders"])

# 6. --- OUTLET SPECIFIC PANEL ROUTES ---
# Ensure these are distinct to avoid 404/Collision
api_router.include_router(
    outletviewproduct.router, 
    prefix="/outlet", 
    tags=["Outlet Products"]
)
api_router.include_router(
    outlet_orders.router, 
    prefix="/outlet/orders", 
    tags=["Outlet Orders"]
)

# 7. Admin & Analytics
api_router.include_router(admin.router, prefix="/admin", tags=["Admin"])
api_router.include_router(sales.router, prefix="/sales", tags=["Sales Analysis"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Admin Dashboard"])