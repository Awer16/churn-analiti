from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT_DIR = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=ROOT_DIR / ".env", extra="ignore")

    app_name: str = "ChurnVision API"
    database_url: str = Field(
        default="postgresql+psycopg://churnvision:churnvision@localhost:5432/churnvision",
        alias="DATABASE_URL",
    )
    secret_key: str = Field(default="change-me", alias="SECRET_KEY")
    access_token_expire_minutes: int = Field(
        default=1440, alias="ACCESS_TOKEN_EXPIRE_MINUTES"
    )
    frontend_origin: str = Field(default="http://localhost:3000", alias="FRONTEND_ORIGIN")


settings = Settings()
