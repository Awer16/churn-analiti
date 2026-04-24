from __future__ import annotations

import csv
import io
import os
import pickle
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from pathlib import Path

import numpy as np
from fastapi import HTTPException, status
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler

REQUIRED_COLUMNS = {"customer_id", "order_date", "amount"}

MODEL_DIR = Path(__file__).parent / "trained_model"
MODEL_PATH = MODEL_DIR / "churn_model.pkl"
SCALER_PATH = MODEL_DIR / "scaler.pkl"

FEATURE_NAMES = [
    "days_since_last_purchase",
    "purchase_count",
    "total_spend",
    "avg_order_value",
    "active_months",
    "visit_frequency",
]

FEATURE_LABELS_RU = {
    "days_since_last_purchase": "Давность последней покупки",
    "purchase_count": "Количество покупок",
    "total_spend": "Общая сумма покупок",
    "avg_order_value": "Средний чек",
    "active_months": "Длительность истории",
    "visit_frequency": "Частота визитов",
}

HIGH_RECOMMENDATIONS = [
    "Клиент давно не покупал — срочно свяжитесь и предложите персональную скидку или бонус.",
    "Высокий риск ухода. Рекомендуется позвонить или отправить персональное предложение.",
    "Клиент может уйти в ближайший месяц — предложите эксклюзивный оффер или программу лояльности.",
    "Активность резко снизилась. Важно быстро отреагировать: скидка, подарок или персональное сообщение.",
    "Риск потери клиента критический. Рекомендуем немедленное персональное касание.",
]

MEDIUM_RECOMMENDATIONS = [
    "Клиент постепенно снижает активность — добавьте в кампанию лояльности и отправьте напоминание о себе.",
    "Умеренный риск. Полезно отправить полезный контент или мягкое предложение без скидки.",
    "Клиент ещё активен, но есть признаки снижения интереса. Поддержите связь рассылкой или бонусами.",
    "Рекомендуется включить в программу удержания: email-рассылка, push-уведомления или небольшие бонусы.",
    "Есть риск снижения частоты покупок. Предложите клиенту что-то новое или напомните о преимуществах.",
]

LOW_RECOMMENDATIONS = [
    "Клиент стабилен и активен. Поддерживайте связь через обычные каналы коммуникации.",
    "Низкий риск — клиент лоялен. Продолжайте стандартную программу удержания.",
    "Всё в порядке: клиент покупает регулярно. Мониторьте и не теряйте контакт.",
    "Активный клиент. Рекомендация: предложить программу лояльности для ещё большего вовлечения.",
    "Риск минимален. Достаточно стандартных коммуникаций и периодических акций.",
]


@dataclass
class PredictionResult:
    customer_id: str
    churn_probability: float
    risk_segment: str
    recommendation: str
    features: dict


def _generate_synthetic_data(n_samples: int = 10000, seed: int = 42) -> tuple[np.ndarray, np.ndarray]:
    rng = np.random.RandomState(seed)

    days_since_last = rng.exponential(scale=45, size=n_samples).clip(0, 365)
    purchase_count = rng.poisson(lam=8, size=n_samples).clip(1, 100).astype(float)
    total_spend = purchase_count * rng.uniform(200, 800, size=n_samples)
    avg_order_value = total_spend / purchase_count
    active_months = (days_since_last / 30 + rng.uniform(1, 12, size=n_samples)).clip(1, 60)
    visit_frequency = rng.uniform(0.5, 15, size=n_samples)

    X = np.column_stack([
        days_since_last,
        purchase_count,
        total_spend,
        avg_order_value,
        active_months,
        visit_frequency,
    ])

    log_odds = (
        0.03 * days_since_last
        - 0.15 * np.log1p(purchase_count)
        - 0.0003 * total_spend
        - 0.002 * avg_order_value
        - 0.08 * active_months
        - 0.12 * visit_frequency
        + 1.5
    )
    prob = 1 / (1 + np.exp(-log_odds))
    y = (rng.random(n_samples) < prob).astype(int)

    return X, y


def _train_and_save_model() -> None:
    X, y = _generate_synthetic_data(n_samples=15000)

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    model = GradientBoostingClassifier(
        n_estimators=150,
        max_depth=4,
        learning_rate=0.1,
        subsample=0.8,
        random_state=42,
    )
    model.fit(X_scaled, y)

    MODEL_DIR.mkdir(parents=True, exist_ok=True)

    with open(MODEL_PATH, "wb") as f:
        pickle.dump(model, f)
    with open(SCALER_PATH, "wb") as f:
        pickle.dump(scaler, f)


def _load_model() -> tuple[GradientBoostingClassifier, StandardScaler]:
    if not MODEL_PATH.exists() or not SCALER_PATH.exists():
        _train_and_save_model()

    with open(MODEL_PATH, "rb") as f:
        model = pickle.load(f)
    with open(SCALER_PATH, "rb") as f:
        scaler = pickle.load(f)

    return model, scaler


class ChurnPredictor:
    def __init__(self) -> None:
        self.model, self.scaler = _load_model()

    def parse_csv(self, content: bytes) -> list[dict]:
        decoded = content.decode("utf-8-sig")
        reader = csv.DictReader(io.StringIO(decoded))
        if not reader.fieldnames:
            raise HTTPException(status_code=400, detail="CSV файл пуст или поврежден.")

        missing = REQUIRED_COLUMNS - set(reader.fieldnames)
        if missing:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Не хватает колонок: {', '.join(sorted(missing))}",
            )

        rows = [row for row in reader]
        if not rows:
            raise HTTPException(status_code=400, detail="CSV файл не содержит строк данных.")
        return rows

    def build_customer_snapshots(self, rows: list[dict]) -> list[dict]:
        grouped: dict[str, dict] = {}
        max_date: date | None = None

        for row in rows:
            customer_id = str(row["customer_id"]).strip()
            if not customer_id:
                continue

            order_date = self._parse_date(row["order_date"])
            amount = self._to_float(row.get("amount", 0))
            visits = self._to_float(row.get("visits", 1), default=1.0)

            if max_date is None or order_date > max_date:
                max_date = order_date

            customer = grouped.setdefault(
                customer_id,
                {
                    "customer_id": customer_id,
                    "first_purchase": order_date,
                    "last_purchase": order_date,
                    "purchase_count": 0,
                    "total_spend": 0.0,
                    "total_visits": 0.0,
                },
            )
            customer["first_purchase"] = min(customer["first_purchase"], order_date)
            customer["last_purchase"] = max(customer["last_purchase"], order_date)
            customer["purchase_count"] += 1
            customer["total_spend"] += amount
            customer["total_visits"] += visits

        if not grouped or max_date is None:
            raise HTTPException(status_code=400, detail="Не удалось обработать CSV данные.")

        reference_date = max_date + timedelta(days=30)
        snapshots: list[dict] = []
        for customer in grouped.values():
            active_days = max(
                (customer["last_purchase"] - customer["first_purchase"]).days, 30
            )
            active_months = round(max(active_days / 30, 1.0), 2)
            avg_order_value = round(
                customer["total_spend"] / max(customer["purchase_count"], 1), 2
            )
            visit_frequency = round(
                customer["total_visits"] / max(active_months, 1.0), 2
            )
            snapshots.append(
                {
                    "customer_id": customer["customer_id"],
                    "days_since_last_purchase": (reference_date - customer["last_purchase"]).days,
                    "purchase_count": customer["purchase_count"],
                    "total_spend": round(customer["total_spend"], 2),
                    "avg_order_value": avg_order_value,
                    "active_months": active_months,
                    "visit_frequency": visit_frequency,
                }
            )

        return sorted(snapshots, key=lambda item: item["customer_id"])

    def predict(self, rows: list[dict]) -> tuple[list[PredictionResult], dict]:
        customer_snapshots = self.build_customer_snapshots(rows)

        feature_matrix = np.array([
            [snapshot[name] for name in FEATURE_NAMES]
            for snapshot in customer_snapshots
        ])
        X_scaled = self.scaler.transform(feature_matrix)
        probabilities = self.model.predict_proba(X_scaled)[:, 1]

        results: list[PredictionResult] = []
        for snapshot, prob in zip(customer_snapshots, probabilities):
            probability = round(float(prob), 4)
            risk_segment = self._segment(probability)
            recommendation = self._recommend(risk_segment, snapshot)
            results.append(
                PredictionResult(
                    customer_id=snapshot["customer_id"],
                    churn_probability=probability,
                    risk_segment=risk_segment,
                    recommendation=recommendation,
                    features={key: value for key, value in snapshot.items() if key != "customer_id"},
                )
            )

        high_risk = [item for item in results if item.risk_segment == "high"]
        medium_risk = [item for item in results if item.risk_segment == "medium"]
        avg_probability = sum(item.churn_probability for item in results) / max(len(results), 1)

        customer_by_id = {item["customer_id"]: item for item in customer_snapshots}
        predicted_revenue_at_risk = sum(
            customer_by_id[item.customer_id]["total_spend"] * item.churn_probability
            for item in results
            if item.risk_segment in ("high", "medium")
        )

        feature_importance = dict(
            zip(
                [FEATURE_LABELS_RU[name] for name in FEATURE_NAMES],
                [round(float(x), 4) for x in self.model.feature_importances_],
            )
        )

        summary = {
            "retention_score": round((1 - avg_probability) * 100, 1),
            "high_risk_share": round(len(high_risk) / max(len(results), 1) * 100, 1),
            "medium_risk_share": round(len(medium_risk) / max(len(results), 1) * 100, 1),
            "predicted_revenue_at_risk": round(predicted_revenue_at_risk, 2),
            "model_type": "Gradient Boosting (scikit-learn)",
            "feature_importance": feature_importance,
        }
        return sorted(results, key=lambda item: item.churn_probability, reverse=True), summary

    @staticmethod
    def _parse_date(value: str) -> date:
        normalized = str(value).strip()
        for pattern in ("%Y-%m-%d", "%d.%m.%Y", "%Y/%m/%d"):
            try:
                return datetime.strptime(normalized, pattern).date()
            except ValueError:
                continue
        raise HTTPException(status_code=422, detail=f"Некорректная дата в CSV: {value}")

    @staticmethod
    def _to_float(value: object, default: float = 0.0) -> float:
        try:
            return float(str(value).replace(",", "."))
        except (TypeError, ValueError):
            return default

    @staticmethod
    def _segment(probability: float) -> str:
        if probability >= 0.7:
            return "high"
        if probability >= 0.4:
            return "medium"
        return "low"

    def _recommend(self, segment: str, snapshot: dict) -> str:
        import random

        if segment == "high":
            return random.choice(HIGH_RECOMMENDATIONS)
        if segment == "medium":
            return random.choice(MEDIUM_RECOMMENDATIONS)
        return random.choice(LOW_RECOMMENDATIONS)


predictor = ChurnPredictor()
