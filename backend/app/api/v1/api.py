from fastapi import APIRouter
from app.api.v1.endpoints import auth
from app.api.v1.endpoints import users
from app.api.v1.endpoints import categories  # <--- YOU NEED TO ADD THIS IMPORT
from app.api.v1.endpoints import certificates
from app.api.v1.endpoints import banners
from app.api.v1.endpoints import products
from app.api.v1.endpoints import termsandconditions
from app.api.v1.endpoints import refundpolicy
from app.api.v1.endpoints import news
from app.api.v1.endpoints import faq
from app.api.v1.endpoints import privacy
from app.api.v1.endpoints import marquee
from app.api.v1.endpoints import contact # Import
from app.api.v1.endpoints import daily_deals
from app.api.v1.endpoints import outlets
from app.api.v1.endpoints import coupons
from app.api.v1.endpoints.outlet import outletviewproduct
from app.api.v1.endpoints import location_products
from app.api.v1.endpoints import public_coupons
from app.api.v1.endpoints import otp
from app.api.v1.endpoints import orders
from app.api.v1.endpoints import cart
from app.api.v1.endpoints import admin
from app.api.v1.endpoints import sales
from app.api.v1.endpoints import dashboard


api_router = APIRouter()

# 1. Login Routes
api_router.include_router(auth.router, tags=["login"])

# 2. Users Routes
api_router.include_router(users.router, prefix="/users", tags=["users"])

# 3. Categories Routes
api_router.include_router(categories.router, prefix="/categories", tags=["categories"])

api_router.include_router(certificates.router,prefix="/certificates",tags=["Certificates"])

api_router.include_router(banners.router,prefix="/banners",tags=["Banners"])

api_router.include_router(products.router, prefix="/products", tags=["Products"])

api_router.include_router(termsandconditions.router,prefix="/termsandconditions",tags=["Terms & Conditions"])

api_router.include_router(refundpolicy.router,prefix="/refund-policy",tags=["Refund Policy"])
api_router.include_router(news.router, prefix="/news", tags=["news"])

api_router.include_router(faq.router, prefix="/faq", tags=["faq"])

api_router.include_router(privacy.router, prefix="/privacy", tags=["privacy"])

api_router.include_router(marquee.router, prefix="/marquee", tags=["marquee"])

api_router.include_router(contact.router, prefix="/contact", tags=["contact"])

api_router.include_router(daily_deals.router, prefix="/daily-deals", tags=["daily-deals"])

api_router.include_router(outlets.router, prefix="/outlets", tags=["outlets"])

api_router.include_router(coupons.router, prefix="/coupons", tags=["coupons"])

api_router.include_router(outletviewproduct.router,prefix="/outlet",tags=["Outlet Products"])

api_router.include_router(location_products.router,prefix="/location-products",tags=["Location Products"])

api_router.include_router(public_coupons.router,prefix="/public-coupons",tags=["Public Coupons"])

api_router.include_router(otp.router, prefix="/otp", tags=["OTP"])

api_router.include_router(orders.router, prefix="/orders", tags=["Orders"])

api_router.include_router(cart.router, prefix="/cart", tags=["Cart"])

api_router.include_router(admin.router, prefix="/admin", tags=["Admin"])

api_router.include_router(sales.router, prefix="/sales", tags=["Sales Analysis"])

api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Admin Dashboard"])