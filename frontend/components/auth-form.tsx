"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { getStoredToken } from "@/lib/session";

type Mode = "login" | "register";

type AuthPayload = {
  access_token: string;
  email: string;
  company_name: string;
};

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getStoredToken()) {
      router.replace("/dashboard");
    }
  }, [router]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const payload =
      mode === "register"
        ? {
            company_name: String(formData.get("company_name") ?? ""),
            email: String(formData.get("email") ?? ""),
            password: String(formData.get("password") ?? "")
          }
        : {
            email: String(formData.get("email") ?? ""),
            password: String(formData.get("password") ?? "")
          };

    try {
      const response = await apiRequest<AuthPayload>(`/auth/${mode}`, {
        method: "POST",
        json: payload
      });
      window.localStorage.setItem("cv_token", response.access_token);
      window.localStorage.setItem("cv_company_name", response.company_name);
      window.localStorage.setItem("cv_email", response.email);
      router.push("/dashboard");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Ошибка авторизации");
    } finally {
      setLoading(false);
    }
  }

  return (
      <div className="auth-card">
        <div className="eyebrow">{mode === "register" ? "Регистрация" : "Вход в кабинет"}</div>
      <h1>{mode === "register" ? "Создайте аккаунт и загрузите первую выгрузку" : "Вернитесь к аналитике"}</h1>
      <p className="panel-copy">
        {mode === "register"
          ? "После регистрации откроется рабочий кабинет, где можно загрузить CSV по продажам и получить прогноз риска оттока."
          : "Введите email и пароль, чтобы открыть личный кабинет и продолжить работу с клиентской базой."}
      </p>
      <form className="auth-form" onSubmit={onSubmit}>
        {mode === "register" ? (
          <div className="field">
            <label htmlFor="company_name">Компания</label>
            <input id="company_name" name="company_name" placeholder="Например, Roast Lab" required />
          </div>
        ) : null}
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" placeholder="owner@coffee.ru" required />
        </div>
        <div className="field">
          <label htmlFor="password">Пароль</label>
          <input id="password" name="password" type="password" minLength={8} required />
        </div>
        {error ? <div className="error">{error}</div> : null}
        <button className="button button-primary" disabled={loading} type="submit">
          {loading ? "Подождите..." : mode === "register" ? "Создать аккаунт" : "Войти"}
        </button>
      </form>
      <p className="panel-copy">
        {mode === "register" ? "Уже есть доступ?" : "Нет аккаунта?"}{" "}
        <Link href={mode === "register" ? "/login" : "/register"} className="muted-link">
          {mode === "register" ? "Войти" : "Зарегистрироваться"}
        </Link>
      </p>
    </div>
  );
}
