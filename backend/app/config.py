from typing import List
import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )

    PROJECT_NAME: str = "TeachMate"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "true").lower() in ("true", "1")

    # Database: Auto-normalize cloud URLs (postgres:// -> postgresql+psycopg://)
    _default_db = "sqlite:////app/data/teachmate.db" if os.path.exists("/app/data") else "postgresql+psycopg://localhost:5432/teachmate"
    _raw_db_url: str = os.getenv("DATABASE_URL", _default_db)
    if _raw_db_url.startswith("postgres://"):
        DATABASE_URL: str = _raw_db_url.replace("postgres://", "postgresql+psycopg://", 1)
    elif _raw_db_url.startswith("postgresql://") and "+psycopg" not in _raw_db_url:
        DATABASE_URL: str = _raw_db_url.replace("postgresql://", "postgresql+psycopg://", 1)
    else:
        DATABASE_URL: str = _raw_db_url

    TEST_DATABASE_URL: str = "sqlite:///./teachmate_test.db"

    # Security & Auth
    SESSION_SECRET: str = os.getenv("SESSION_SECRET", "teachmate-super-secret-key-change-in-production-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    COOKIE_NAME: str = "teachmate_session"
    COOKIE_SECURE: bool = os.getenv("COOKIE_SECURE", "false").lower() in ("true", "1")
    COOKIE_SAMESITE: str = os.getenv("COOKIE_SAMESITE", "lax")

    # LLM Settings
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")
    USE_MOCK_LLM: bool = os.getenv("USE_MOCK_LLM", "false").lower() in ("true", "1", "yes")
    LLM_TIMEOUT_SECONDS: int = 30
    LLM_MAX_RETRIES: int = 2

    # CORS: Support comma-separated env var or wildcard
    _cors_env: str = os.getenv("CORS_ORIGINS", "")
    if _cors_env:
        CORS_ORIGINS: List[str] = [origin.strip() for origin in _cors_env.split(",") if origin.strip()]
    else:
        CORS_ORIGINS: List[str] = [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000",
            "http://127.0.0.1:3000"
        ]

settings = Settings()
