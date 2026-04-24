from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    company_name: Mapped[str] = mapped_column(String(255))
    company_full_name: Mapped[str | None] = mapped_column(String(512), nullable=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    uploads: Mapped[list["UploadRun"]] = relationship(back_populates="user")


class UploadRun(Base):
    __tablename__ = "upload_runs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    filename: Mapped[str] = mapped_column(String(255))
    status: Mapped[str] = mapped_column(String(50), default="completed")
    customers_analyzed: Mapped[int] = mapped_column(Integer, default=0)
    churn_risk_count: Mapped[int] = mapped_column(Integer, default=0)
    avg_churn_probability: Mapped[float] = mapped_column(Float, default=0.0)
    summary: Mapped[dict] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User"] = relationship(back_populates="uploads")
    predictions: Mapped[list["Prediction"]] = relationship(back_populates="upload_run")


class Prediction(Base):
    __tablename__ = "predictions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    upload_run_id: Mapped[int] = mapped_column(
        ForeignKey("upload_runs.id", ondelete="CASCADE")
    )
    customer_id: Mapped[str] = mapped_column(String(255), index=True)
    churn_probability: Mapped[float] = mapped_column(Float)
    risk_segment: Mapped[str] = mapped_column(String(50))
    features: Mapped[dict] = mapped_column(JSON)
    recommendation: Mapped[str] = mapped_column(Text)

    upload_run: Mapped["UploadRun"] = relationship(back_populates="predictions")
