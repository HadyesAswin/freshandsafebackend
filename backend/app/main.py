from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.api import api_router
from app.tasks import test_email_task # <--- Import the task
from fastapi.staticfiles import StaticFiles
import os
from app.websockets import order_ws
from app.routers import outlet_auth

app = FastAPI(title="FreshToHome Clone Admin API")
app.include_router(order_ws.router)

# 1. Set up CORS (So your Frontend can talk to this Backend)
origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://172.29.240.1:3000",
    "http://192.168.1.7:3000",
    "http://10.103.74.232:3000",
    "http://192.168.1.9:3000",
    "https://subhemispherical-fallon-fidgety.ngrok-free.dev"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Include the API Router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def read_root():
    return {"status": "Server is running", "docs_url": "http://localhost:8000/docs"}

@app.post("/test-celery")
def test_celery_endpoint(email: str):
    # .delay() is the magic word. It sends the task to Redis and returns immediately.
    test_email_task.delay(email)
    return {"message": "Email task sent to background worker!"}

os.makedirs("static/uploads", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(outlet_auth.router, prefix="/api/v1/outlet", tags=["Outlet Auth"])