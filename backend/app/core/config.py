from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "FreshAndSafe"
    
    # --- SECURITY ---
    SECRET_KEY: str = "CHANGE_THIS_TO_A_SUPER_SECRET_KEY_12345"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8 

    # --- DATABASE VARIABLES ---
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_DB: str = "freshclone_db"

    # --- REDIS & CELERY (This is what was missing!) ---
    CELERY_BROKER_URL: str = "redis://redis:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://redis:6379/0"

    # SMTP_SERVER: str = "smtp.gmail.com"
    # SMTP_PORT: int = 587
    # SMTP_USERNAME: str = "etournament49@gmail.com"
    # SMTP_PASSWORD: str = "ojdx cilt szko apwu"

    # --- QWQER LOGISTICS (NEW) ---
    # These will be used by your QwqerService
    QWQER_API_URL: str = "https://stage-api.qwqer.in/v2/" 
    QWQER_CLIENT_SECRET: str = "5uPZIT5GZKwom82dUbZKSAMRC3DrPglXas0ApMFvMptXMQJiEIImzxMFKKzQRqgM"

    RAZORPAY_KEY_ID: str
    RAZORPAY_KEY_SECRET: str

    # Database URL Builder
    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}/{self.POSTGRES_DB}"

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()