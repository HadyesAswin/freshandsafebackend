import redis
from app.core.config import settings

# Create a Redis connection pool
# decode_responses=True ensures we get Strings back, not Bytes
redis_client = redis.Redis.from_url(settings.CELERY_BROKER_URL, decode_responses=True)

def get_redis_client():
    return redis_client