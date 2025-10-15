from pydantic import BaseSettings
from pathlib import Path

class Settings(BaseSettings):
    OLLAMA_ENDPOINT: str = "http://ollama:11434"  # docker service name
    MODEL_NAME: str = "phi3:mini"
    GOOGLE_CRED_PATH: str = "/run/secrets/google_credentials"  # via Docker secrets
    GOOGLE_TOKEN_PATH: str = "/data/google_token.json"
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:8080"

settings = Settings()
