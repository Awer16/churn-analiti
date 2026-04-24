"use client";

import { useState } from "react";
import { Nav } from "@/components/nav";

type RiskCustomer = {
  customer_id: string;
  churn_probability: number;
  risk_segment: string;
  recommendation: string;
  features: Record<string, string | number>;
};

const DEMO_DATA = {
  upload_id: 0,
  filename: "demo_sales.csv",
  customers_analyzed: 1250,
  churn_risk_count: 187,
  avg_churn_probability: 0.42,
  summary: {
    retention_score: 71.4,
    high_risk_share: 15,
    medium_risk_share: 28,
    predicted_revenue_at_risk: 184000,
    model_type: "Demo mode",
  },
  created_at: new Date().toISOString(),
  high_risk_customers: [
    {
      customer_id: "CUST-001",
      churn_probability: 0.92,
      risk_segment: "high",
      recommendation: "Связаться немедленно: предложить скидку 20-30%",
      features: {
        days_since_last_purchase: 87,
        purchase_count: 12,
        avg_order_value: 2850
      }
    },
    {
      customer_id: "CUST-008",
      churn_probability: 0.88,
      risk_segment: "high",
      recommendation: "Срочный контакт: предложить эксклюзивный оффер",
      features: {
        days_since_last_purchase: 65,
        purchase_count: 8,
        avg_order_value: 1950
      }
    },
    {
      customer_id: "CUST-015",
      churn_probability: 0.85,
      risk_segment: "high",
      recommendation: "Личное предложение: возврат на 15-25%",
      features: {
        days_since_last_purchase: 92,
        purchase_count: 15,
        avg_order_value: 3200
      }
    },
    {
      customer_id: "CUST-022",
      churn_probability: 0.78,
      risk_segment: "high",
      recommendation: "Отправить персональное предложение",
      features: {
        days_since_last_purchase: 72,
        purchase_count: 9,
        avg_order_value: 2100
      }
    },
    {
      customer_id: "CUST-031",
      churn_probability: 0.74,
      risk_segment: "high",
      recommendation: "Программа лояльности: дополнительные баллы",
      features: {
        days_since_last_purchase: 58,
        purchase_count: 11,
        avg_order_value: 2600
      }
    },
    {
      customer_id: "CUST-045",
      churn_probability: 0.68,
      risk_segment: "medium",
      recommendation: "Добавить в кампанию лояльности",
      features: {
        days_since_last_purchase: 45,
        purchase_count: 7,
        avg_order_value: 1800
      }
    },
    {
      customer_id: "CUST-052",
      churn_probability: 0.61,
      risk_segment: "medium",
      recommendation: "Мягкий ремаркетинг без агрессивных скидок",
      features: {
        days_since_last_purchase: 38,
        purchase_count: 5,
        avg_order_value: 1200
      }
    }
  ]
};

export default function DemoPage() {
  const [overview] = useState(DEMO_DATA);

  return (
    <>
      <Nav />
      <main className="page-shell dashboard-layout">
        <div className="dashboard-top">
          <div>
            <div className="eyebrow">Демо-режим</div>
            <h1 className="dashboard-title">Посмотрите, как работает ChurnVision</h1>
            <p className="panel-copy">
              Это демонстрационные данные. Зарегистрируйтесь, чтобы загрузить свой CSV и получить реальный прогноз оттока.
            </p>
          </div>
          <div className="dashboard-actions">
            <div className="status-pill">Демо-данные • {new Date().toLocaleDateString("ru-RU")}</div>
          </div>
        </div>

        <div className="metrics-grid dashboard-metrics-grid">
          <div className="metric-card">
            <div className="metric-value">{overview.customers_analyzed}</div>
            <div>клиентов проанализировано</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{overview.summary.retention_score}</div>
            <div>общий индекс удержания</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{overview.churn_risk_count}</div>
            <div>клиентов с высоким риском</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{Math.round(overview.avg_churn_probability * 100)}%</div>
            <div>средняя вероятность оттока</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{overview.summary.high_risk_share}%</div>
            <div>доля клиентов с высоким риском</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">₽{Math.round(overview.summary.predicted_revenue_at_risk).toLocaleString("ru-RU")}</div>
            <div>прогноз выручки под риском</div>
          </div>
        </div>

        <div className="dashboard-panel dashboard-table-panel">
          <div className="section-header">
            <div>
              <h2 style={{ margin: 0 }}>Клиенты, требующие внимания</h2>
            </div>
            <p>Эти клиенты рискуют уйти первыми. Начните работу с верхних строк таблицы.</p>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Клиент</th>
                <th>Риск</th>
                <th>Вероятность</th>
                <th>Признаки</th>
                <th>Рекомендация</th>
              </tr>
            </thead>
            <tbody>
              {overview.high_risk_customers.map((customer: RiskCustomer) => (
                <tr key={customer.customer_id}>
                  <td data-label="Клиент">{customer.customer_id}</td>
                  <td data-label="Риск">
                    <span className={`tag ${customer.risk_segment}`}>{customer.risk_segment}</span>
                  </td>
                  <td data-label="Вероятность">{Math.round(customer.churn_probability * 100)}%</td>
                  <td data-label="Признаки">
                    Последняя покупка: {String(customer.features.days_since_last_purchase)} дн.
                    <br />
                    Покупок: {String(customer.features.purchase_count)}
                    <br />
                    Средний чек: ₽{String(customer.features.avg_order_value)}
                  </td>
                  <td data-label="Рекомендация">{customer.recommendation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
