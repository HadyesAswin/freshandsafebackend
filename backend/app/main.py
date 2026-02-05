from fastapi import FastAPI
from app.core.config import settings

app = FastAPI(title=settings.PROJECT_NAME)

@app.get("/")
def read_root():
    return {"message": "Welcome to the FreshClone API - Admin Setup Mode"}

# Later you will import routers here:
# app.include_router(admin_router, prefix="/api/v1/admin")