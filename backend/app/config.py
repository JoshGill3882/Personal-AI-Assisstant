"""Configuration management for the backend service."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Environment-driven knobs that control the backend behaviour."""

    # URL for the Ollama instance that serves chat completions.
    OLLAMA_ENDPOINT: str = "http://ollama:11434"
    # Model identifier exposed by Ollama to use for conversations.
    MODEL_NAME: str = "phi3:mini"
    # Hard cap to keep responses bounded and avoid slow generations.
    LLM_MAX_TOKENS: int = 1024
    # Docker secret containing the Google OAuth client credentials.
    GOOGLE_CRED_PATH: str = "/run/secrets/google_credentials"
    # Location on the container filesystem where refreshed tokens are stored.
    GOOGLE_TOKEN_PATH: str = "/data/google_token.json"
    # Comma-separated origins allowed to reach the API.
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:8080"


settings = Settings()
