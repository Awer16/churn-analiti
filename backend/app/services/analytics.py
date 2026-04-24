from __future__ import annotations

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import Prediction, UploadRun, User
from app.ml.churn_model import predictor
from app.schemas.analytics import OverviewResponse, RiskCustomer


def process_csv(file: UploadFile, user: User, db: Session) -> OverviewResponse:
    content = file.file.read()
    if not content:
        raise HTTPException(status_code=400, detail="CSV файл пуст.")

    rows = predictor.parse_csv(content)
    predictions, summary = predictor.predict(rows)
    upload_run = UploadRun(
        user_id=user.id,
        filename=file.filename or "uploaded.csv",
        customers_analyzed=len(predictions),
        churn_risk_count=sum(1 for item in predictions if item.risk_segment == "high"),
        avg_churn_probability=round(
            sum(item.churn_probability for item in predictions) / max(len(predictions), 1),
            4,
        ),
        summary=summary,
    )
    db.add(upload_run)
    db.flush()

    db.add_all(
        [
            Prediction(
                upload_run_id=upload_run.id,
                customer_id=item.customer_id,
                churn_probability=item.churn_probability,
                risk_segment=item.risk_segment,
                features=item.features,
                recommendation=item.recommendation,
            )
            for item in predictions
        ]
    )
    db.commit()
    db.refresh(upload_run)
    return build_overview(upload_run.id, user, db)


def build_overview(upload_id: int, user: User, db: Session) -> OverviewResponse:
    upload_run = db.scalar(
        select(UploadRun).where(
            UploadRun.id == upload_id,
            UploadRun.user_id == user.id,
        )
    )
    if not upload_run:
        raise HTTPException(status_code=404, detail="Аналитический запуск не найден.")

    predictions = db.scalars(
        select(Prediction)
        .where(Prediction.upload_run_id == upload_run.id)
        .order_by(Prediction.churn_probability.desc())
        .limit(10)
    ).all()

    return OverviewResponse(
        upload_id=upload_run.id,
        filename=upload_run.filename,
        customers_analyzed=upload_run.customers_analyzed,
        churn_risk_count=upload_run.churn_risk_count,
        avg_churn_probability=upload_run.avg_churn_probability,
        summary=upload_run.summary,
        created_at=upload_run.created_at,
        high_risk_customers=[
            RiskCustomer(
                customer_id=item.customer_id,
                churn_probability=item.churn_probability,
                risk_segment=item.risk_segment,
                recommendation=item.recommendation,
                features=item.features,
            )
            for item in predictions
        ],
    )


def latest_overview(user: User, db: Session) -> OverviewResponse:
    upload_run = db.scalar(
        select(UploadRun)
        .where(UploadRun.user_id == user.id)
        .order_by(UploadRun.created_at.desc())
    )
    if not upload_run:
        raise HTTPException(status_code=404, detail="Загрузок пока нет.")
    return build_overview(upload_run.id, user, db)
