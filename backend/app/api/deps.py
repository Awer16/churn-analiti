from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.models import User
from app.db.session import get_db

bearer_scheme = HTTPBearer()

DbSession = Annotated[Session, Depends(get_db)]


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(bearer_scheme)],
    db: DbSession,
) -> User:
    try:
        payload = jwt.decode(
            credentials.credentials, settings.secret_key, algorithms=["HS256"]
        )
        user_id = int(payload["sub"])
    except Exception as exc:  # pragma: no cover
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Токен недействителен.",
        ) from exc

    user = db.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Пользователь не найден.",
        )
    return user
