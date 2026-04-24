from typing import Annotated

from fastapi import APIRouter, Depends, File, UploadFile

from app.api.deps import DbSession, get_current_user
from app.db.models import User
from app.schemas.analytics import OverviewResponse
from app.services.analytics import latest_overview, process_csv

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.post("/upload", response_model=OverviewResponse)
def upload_sales_csv(
    file: Annotated[UploadFile, File(...)],
    db: DbSession,
    user: Annotated[User, Depends(get_current_user)],
):
    return process_csv(file, user, db)


@router.get("/latest", response_model=OverviewResponse)
def get_latest_overview(
    db: DbSession,
    user: Annotated[User, Depends(get_current_user)],
):
    return latest_overview(user, db)
