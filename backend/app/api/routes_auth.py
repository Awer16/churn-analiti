from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import DbSession, get_current_user
from app.db.models import User
from app.db.session import get_db
from app.schemas.auth import AuthResponse, LoginRequest, ProfileResponse, ProfileUpdateRequest, RegisterRequest
from app.services.auth import get_user_profile, login_user, register_user, update_user_profile

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponse)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    return register_user(payload, db)


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    return login_user(payload, db)


@router.get("/profile", response_model=ProfileResponse)
def get_profile(
    db: DbSession,
    user: User = Depends(get_current_user),
):
    return get_user_profile(user, db)


@router.post("/profile", response_model=ProfileResponse)
def update_profile(
    payload: ProfileUpdateRequest,
    db: DbSession,
    user: User = Depends(get_current_user),
):
    return update_user_profile(user, payload, db)
