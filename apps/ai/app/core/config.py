from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    AI_SERVICE_PORT: int = 8001
    AI_PROVIDER: str = "mock"  # 'mock', 'openai', 'gemini'
    AI_MODEL: str = "mock-model-v1"
    AI_API_KEY: str = "mock-dev-key"
    OPENAI_API_BASE: str = "https://api.openai.com/v1"
    GEMINI_API_KEY: Optional[str] = None
    MAX_TOKENS_PER_REQUEST: int = 4096
    TEMPERATURE: float = 0.2

settings = Settings()
