"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { Nav } from "@/components/nav";
import { getStoredToken } from "@/lib/session";

type UploadInfo = {
  id: number;
  filename: string;
  customers_analyzed: number;
  churn_risk_count: number;
  avg_churn_probability: number;
  created_at: string;
};

type UserProfile = {
  email: string;
  company_name: string;
  company_full_name: string | null;
  uploads: UploadInfo[];
};

export default function ProfilePage() {
  const router = useRouter();
  const [token, setToken] = useState<string>("");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [companyFullName, setCompanyFullName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const savedToken = getStoredToken();
    if (!savedToken) {
      router.replace("/login");
      return;
    }

    setToken(savedToken);
    const email = window.localStorage.getItem("cv_email");
    const company_name = window.localStorage.getItem("cv_company_name");
    const company_full_name = window.localStorage.getItem("cv_company_full_name");

    if (email && company_name) {
      setProfile({
        email,
        company_name,
        company_full_name: company_full_name || null,
        uploads: [],
      });
      setCompanyName(company_name);
      setCompanyFullName(company_full_name || "");
    }
    setLoading(false);
  }, [router]);

  async function loadProfile() {
    try {
      const response = await fetch("/api/auth/profile", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setCompanyName(data.company_name);
        setCompanyFullName(data.company_full_name || "");
      }
    } catch {
      // silently ignore
    }
  }

  useEffect(() => {
    if (token) {
      loadProfile();
    }
  }, [token]);

  async function onUpdateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/auth/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          company_name: companyName,
          company_full_name: companyFullName || null,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({ detail: "Ошибка" }));
        throw new Error(payload.detail ?? "Ошибка обновления профиля");
      }

      const data = await response.json();
      setProfile(data);
      window.localStorage.setItem("cv_company_name", companyName);
      window.localStorage.setItem("cv_company_full_name", companyFullName);
      setEditing(false);
      setSuccess("Профиль обновлен успешно!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка обновления профиля");
    } finally {
      setSaving(false);
    }
  }

  function formatProbability(val: number) {
    return `${Math.round(val * 100)}%`;
  }

  if (loading) {
    return (
      <>
        <Nav />
        <main className="page-shell">
          <div className="dashboard-panel">
            <p>Загружаем профиль...</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Nav />
      <main className="page-shell auth-layout">
        <div className="auth-grid">
          <div className="auth-card">
            <div className="eyebrow">Настройки</div>
            <h1>Профиль компании</h1>
            <p className="panel-copy">
              Основная информация о вашей компании и загруженных данных.
            </p>

            {profile && (
              <form className="auth-form" onSubmit={onUpdateProfile}>
                <div className="field">
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    value={profile.email}
                    disabled
                    className="disabled-input"
                  />
                  <small className="field-hint">Email не может быть изменен</small>
                </div>

                <div className="field">
                  <label htmlFor="company">Название компании</label>
                  <input
                    id="company"
                    name="company"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    disabled={!editing}
                    placeholder="Например, АШАН"
                  />
                </div>

                <div className="field">
                  <label htmlFor="company_full">Полное название компании</label>
                  <input
                    id="company_full"
                    name="company_full"
                    value={companyFullName}
                    onChange={(e) => setCompanyFullName(e.target.value)}
                    disabled={!editing}
                    placeholder="Например, ООО АШАН"
                  />
                </div>

                {error && <div className="error">{error}</div>}
                {success && <div className="success">{success}</div>}

                <div className="profile-actions">
                  {editing ? (
                    <>
                      <button
                        type="submit"
                        className="button button-primary"
                        disabled={saving}
                      >
                        {saving ? "Сохраняем..." : "Сохранить"}
                      </button>
                      <button
                        type="button"
                        className="button button-secondary"
                        onClick={() => {
                          setEditing(false);
                          setCompanyName(profile.company_name);
                          setCompanyFullName(profile.company_full_name || "");
                        }}
                      >
                        Отменить
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="button button-primary"
                      onClick={() => setEditing(true)}
                    >
                      Редактировать
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>

          <div className="dashboard-panel profile-info-panel">
            <h3 className="profile-info-title">Загруженные данные</h3>

            {profile && profile.uploads.length > 0 ? (
              <div className="uploads-list">
                {profile.uploads.map((upload) => (
                  <div key={upload.id} className="upload-item">
                    <div className="upload-item-header">
                      <span className="upload-filename">{upload.filename}</span>
                      <span className="upload-date">
                        {new Date(upload.created_at).toLocaleDateString("ru-RU")}
                      </span>
                    </div>
                    <div className="upload-item-stats">
                      <div className="upload-stat">
                        <span className="upload-stat-value">{upload.customers_analyzed}</span>
                        <span className="upload-stat-label">клиентов</span>
                      </div>
                      <div className="upload-stat">
                        <span className="upload-stat-value">{upload.churn_risk_count}</span>
                        <span className="upload-stat-label">в зоне риска</span>
                      </div>
                      <div className="upload-stat">
                        <span className="upload-stat-value">{formatProbability(upload.avg_churn_probability)}</span>
                        <span className="upload-stat-label">средний риск</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="uploads-empty">
                <p className="panel-copy">Загруженных файлов пока нет. Перейдите в личный кабинет и загрузите первый CSV.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
