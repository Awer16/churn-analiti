"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { clearSession, getStoredToken } from "@/lib/session";

type RiskCustomer = {
  customer_id: string;
  churn_probability: number;
  risk_segment: string;
  recommendation: string;
  features: Record<string, string | number>;
};

type OverviewResponse = {
  upload_id: number;
  filename: string;
  customers_analyzed: number;
  churn_risk_count: number;
  avg_churn_probability: number;
  summary: {
    retention_score: number;
    high_risk_share: number;
    medium_risk_share: number;
    predicted_revenue_at_risk: number;
    model_type?: string;
  };
  created_at: string;
  high_risk_customers: RiskCustomer[];
};

export function DashboardClient() {
  const [token, setToken] = useState<string>("");
  const [companyName, setCompanyName] = useState<string>("ваша компания");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  useEffect(() => {
    const savedToken = getStoredToken();
    const savedCompanyName = window.localStorage.getItem("cv_company_name") ?? "ваша компания";
    setToken(savedToken);
    setCompanyName(savedCompanyName);
    if (!savedToken) {
      setLoading(false);
      return;
    }

    apiRequest<OverviewResponse>("/analytics/latest", { token: savedToken })
      .then((payload) => setOverview(payload))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    setSelectedFile(event.target.files?.[0] ?? null);
  }

  function onDragOver(event: React.DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(true);
  }

  function onDragLeave(event: React.DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
  }

  function onDrop(event: React.DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type === "text/csv" || file.name.endsWith(".csv")) {
        setSelectedFile(file);
        setError("");
      } else {
        setError("Пожалуйста, загрузите CSV файл");
      }
    }
  }

  async function onUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !selectedFile) {
      setError("Сначала войдите и выберите CSV файл.");
      return;
    }

    setUploading(true);
    setError("");
    setSuccess("");
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const payload = await apiRequest<OverviewResponse>("/analytics/upload", {
        method: "POST",
        token,
        body: formData
      });
      setOverview(payload);
      setSuccess("CSV обработан. Дашборд обновлен новой аналитикой.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось обработать файл.");
    } finally {
      setUploading(false);
    }
  }

  if (!token && !loading) {
    return (
      <div className="dashboard-panel">
        <div className="error">Нет авторизации. Перейдите на страницу регистрации или входа.</div>
      </div>
    );
  }

  return (
    <>
      <div className="dashboard-top">
        <div>
          <div className="eyebrow">Рабочий кабинет</div>
          <h1 className="dashboard-title">Панель аналитики {companyName}</h1>
          <p className="panel-copy">
            Загружайте историю продаж, получайте понятную оценку риска и быстро находите клиентов,
            которых нужно удержать в первую очередь.
          </p>
        </div>
        <div className="dashboard-actions">
          <div className="status-pill">
            {overview
              ? `Последний отчёт: ${new Date(overview.created_at).toLocaleDateString("ru-RU")}`
              : "Нет данных"}
          </div>
        </div>
      </div>

      <div className="dashboard-hero-grid">
        <div className="dashboard-panel dashboard-upload-panel">
          <h2>Загрузите файл с продажами</h2>
          <p className="panel-copy">
            Подойдёт обычный CSV-файл. Минимально нужны колонки <code>customer_id</code>, <code>order_date</code> и <code>amount</code>.
          </p>
          <form className="upload-form" onSubmit={onUpload}>
            <input
              id="csv-file"
              type="file"
              accept=".csv,text/csv"
              onChange={onFileChange}
              hidden
            />
            <label
              htmlFor="csv-file"
              className={`file-drop-zone ${isDragOver ? "dragover" : ""}`}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
            >
              <div className="file-drop-content">
                <div className="file-drop-icon">📁</div>
                <div className="file-drop-text">
                  <strong>
                    {selectedFile ? selectedFile.name : "Перетащите файл сюда"}
                  </strong>
                  {!selectedFile && "или нажмите чтобы выбрать"}
                </div>
              </div>
            </label>
            {error ? <div className="error">{error}</div> : null}
            {success ? <div className="success">{success}</div> : null}
            <button
              className="button button-primary button-large"
              type="submit"
              disabled={uploading || !selectedFile}
            >
              {uploading ? "Обрабатываем..." : "Загрузить и получить результат"}
            </button>
          </form>
        </div>

        <div className="dashboard-panel dashboard-help-panel">
          <h2>Как пользоваться кабинетом</h2>
          <div className="dashboard-checklist">
            <div className="check-item">
              <strong>1</strong>
              <span>Загрузите свежую историю покупок клиентов.</span>
            </div>
            <div className="check-item">
              <strong>2</strong>
              <span>Посмотрите общий уровень риска и список клиентов, которым нужен контакт.</span>
            </div>
            <div className="check-item">
              <strong>3</strong>
              <span>Начните работу с верхних строк таблицы: это самые уязвимые клиенты.</span>
            </div>
          </div>
        </div>
      </div>

      {overview ? (
        <>
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
              <div className="metric-value">₽{Math.round(overview.summary.predicted_revenue_at_risk)}</div>
              <div>прогноз выручки под риском</div>
            </div>
          </div>

          <div className="dashboard-panel dashboard-table-panel">
            <div className="section-header">
              <div>
                <h2 style={{ margin: 0 }}>Клиенты, требующие внимания</h2>
              </div>
              <p>Начните работу с верхних строк таблицы: именно эти клиенты рискуют уйти первыми.</p>
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
                {overview.high_risk_customers.map((customer) => (
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
        </>
      ) : (
        <div className="dashboard-panel dashboard-empty-panel">
          <p className="panel-copy">
            Пока нет данных. Загрузите первый CSV, и кабинет сразу покажет понятную картину по клиентам.
          </p>
        </div>
      )}
    </>
  );
}
