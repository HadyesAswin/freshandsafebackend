from fastapi import APIRouter
from app.api.v1.endpoints import auth
from app.api.v1.endpoints import users
from app.api.v1.endpoints import categories  # <--- YOU NEED TO ADD THIS IMPORT

api_router = APIRouter()

# 1. Login Routes
api_router.include_router(auth.router, tags=["login"])

# 2. Users Routes
api_router.include_router(users.router, prefix="/users", tags=["users"])

# 3. Categories Routes
api_router.include_router(categories.router, prefix="/categories", tags=["categories"])