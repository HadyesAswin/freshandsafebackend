from fastapi import APIRouter
from app.api.v1.endpoints import auth
from app.api.v1.endpoints import users
from app.api.v1.endpoints import categories  # <--- YOU NEED TO ADD THIS IMPORT
from app.api.v1.endpoints import certificates
from app.api.v1.endpoints import news
from app.api.v1.endpoints import faq
from app.api.v1.endpoints import privacy
from app.api.v1.endpoints import marquee

api_router = APIRouter()

# 1. Login Routes
api_router.include_router(auth.router, tags=["login"])

# 2. Users Routes
api_router.include_router(users.router, prefix="/users", tags=["users"])

# 3. Categories Routes
api_router.include_router(categories.router, prefix="/categories", tags=["categories"])

api_router.include_router(certificates.router,prefix="/certificates",tags=["Certificates"])

api_router.include_router(news.router, prefix="/news", tags=["news"])

api_router.include_router(faq.router, prefix="/faq", tags=["faq"])

api_router.include_router(privacy.router, prefix="/privacy", tags=["privacy"])

api_router.include_router(marquee.router, prefix="/marquee", tags=["marquee"])