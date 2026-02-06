from fastapi import APIRouter
from app.api.v1.endpoints import auth
from app.api.v1.endpoints import users
from app.api.v1.endpoints import categories  # <--- YOU NEED TO ADD THIS IMPORT
from app.api.v1.endpoints import certificates
from app.api.v1.endpoints import banners
from app.api.v1.endpoints import products
from app.api.v1.endpoints import termsandconditions
from app.api.v1.endpoints import refundpolicy

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