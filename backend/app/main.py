from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes_analytics import router as analytics_router
from app.api.routes_auth import router as auth_router
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine

Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.app_name)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth_router)
app.include_router(analytics_router)


@app.get("/health")
def healthcheck():
    return {"status": "ok"}
