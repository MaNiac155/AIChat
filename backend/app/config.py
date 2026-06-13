from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


PROJECT_ROOT = Path(__file__).resolve().parents[2]
ENV_FILE = PROJECT_ROOT / ".env"


class Settings(BaseSettings):
    app_name: str
    app_env: str
    debug: bool
    mock_mode: bool

    backend_host: str
    backend_port: int
    cors_origins: str

    model_api_key: str
    model_base_url: str
    chat_model: str
    vision_model: str
    model_timeout_seconds: float
    model_trust_env: bool

    chat_temperature: float
    chat_memory_max_messages: int
    chat_system_prompt: str
    vision_max_tokens: int
    vision_system_prompt: str
    vision_cache_ttl_seconds: float

    model_config = SettingsConfigDict(
        env_file=ENV_FILE,
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def allowed_origins(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.cors_origins.split(",")
            if origin.strip()
        ]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
