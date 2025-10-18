"""Configuration management for the backend service."""

from pydantic_settings import BaseSettings, SettingsConfigDict
from os import getenv


class Settings(BaseSettings):
    """Environment-driven knobs that control the backend behaviour."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", populate_by_name=True)

    # Docker secret containing the Google OAuth client credentials.
    GOOGLE_CRED_PATH: str = "/run/secrets/google_credentials"
    # Location on the container filesystem where refreshed tokens are stored.
    GOOGLE_TOKEN_PATH: str = "/data/google_token.json"
    # Comma-separated origins allowed to reach the API.
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:8080"

    # API credentials and tuning knobs for OpenAI-hosted models.
    OPENAI_API_KEY: str = getenv("OPENAI_API_KEY")
    OPENAI_BASE_URL: str = "https://api.openai.com/v1"
    OPENAI_SIMPLE_MODEL: str = "gpt-4o-mini"
    OPENAI_COMPLEX_MODEL: str = "gpt-5-mini"
    OPENAI_COMPLEXITY_THRESHOLD: float = 30.0
    OPENAI_COMPLEXITY_LENGTH_WEIGHT: float = 0.05
    OPENAI_COMPLEXITY_QUESTION_WEIGHT: float = 2.0
    OPENAI_COMPLEXITY_KEYWORD_BONUS: float = 12.0


settings = Settings()
