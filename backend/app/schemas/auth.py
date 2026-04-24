from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    company_name: str = Field(min_length=2, max_length=255)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    company_name: str
    email: EmailStr


class ProfileUpdateRequest(BaseModel):
    company_name: str = Field(min_length=2, max_length=255)
    company_full_name: str | None = None


class UploadInfo(BaseModel):
    id: int
    filename: str
    customers_analyzed: int
    churn_risk_count: int
    avg_churn_probability: float
    created_at: datetime


class ProfileResponse(BaseModel):
    email: str
    company_name: str
    company_full_name: str | None = None
    uploads: list[UploadInfo] = []
