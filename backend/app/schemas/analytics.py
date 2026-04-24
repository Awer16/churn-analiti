from datetime import datetime

from pydantic import BaseModel


class RiskCustomer(BaseModel):
    customer_id: str
    churn_probability: float
    risk_segment: str
    recommendation: str
    features: dict


class OverviewResponse(BaseModel):
    upload_id: int
    filename: str
    customers_analyzed: int
    churn_risk_count: int
    avg_churn_probability: float
    summary: dict
    created_at: datetime
    high_risk_customers: list[RiskCustomer]
