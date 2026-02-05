from celery import Celery
import os

# 1. Define the Redis URL (Docker service name is 'redis')
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")

# 2. Create the Celery App
celery_app = Celery(
    "worker",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["app.tasks"]
)

# 3. Optional: Configure settings
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)