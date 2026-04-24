from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password, verify_password
from app.db.models import UploadRun, User
from app.schemas.auth import AuthResponse, LoginRequest, ProfileResponse, ProfileUpdateRequest, RegisterRequest, UploadInfo


def register_user(payload: RegisterRequest, db: Session) -> AuthResponse:
    existing = db.scalar(select(User).where(User.email == payload.email))
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User with this email already exists.",
        )

    user = User(
        company_name=payload.company_name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return AuthResponse(
        access_token=create_access_token(str(user.id)),
        company_name=user.company_name,
        email=user.email,
    )


def login_user(payload: LoginRequest, db: Session) -> AuthResponse:
    user = db.scalar(select(User).where(User.email == payload.email))
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    return AuthResponse(
        access_token=create_access_token(str(user.id)),
        company_name=user.company_name,
        email=user.email,
    )


def get_user_profile(user: User, db: Session) -> ProfileResponse:
    uploads = db.scalars(
        select(UploadRun)
        .where(UploadRun.user_id == user.id)
        .order_by(UploadRun.created_at.desc())
        .limit(20)
    ).all()

    return ProfileResponse(
        email=user.email,
        company_name=user.company_name,
        company_full_name=user.company_full_name,
        uploads=[
            UploadInfo(
                id=u.id,
                filename=u.filename,
                customers_analyzed=u.customers_analyzed,
                churn_risk_count=u.churn_risk_count,
                avg_churn_probability=u.avg_churn_probability,
                created_at=u.created_at,
            )
            for u in uploads
        ],
    )


def update_user_profile(user: User, payload: ProfileUpdateRequest, db: Session) -> ProfileResponse:
    user.company_name = payload.company_name
    if payload.company_full_name is not None:
        user.company_full_name = payload.company_full_name
    db.commit()
    db.refresh(user)

    return get_user_profile(user, db)
