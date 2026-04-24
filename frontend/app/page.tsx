"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Nav } from "@/components/nav";
import { getStoredToken } from "@/lib/session";

const featureCards = [
  {
    title: "Прогноз оттока на следующий месяц",
    text: "Загружаете CSV из POS, CRM или Google Sheets, сервис автоматически рассчитывает риск ухода каждого клиента."
  },
  {
    title: "Локальный аналитический движок",
    text: "Сервис сам рассчитывает показатели клиентов и формирует понятную оценку риска без сложной настройки и лишних интеграций."
  },
  {
    title: "Панель принятия решений",
    text: "Индекс удержания, выручка под риском, сегменты высокого риска и список клиентов, на которых нужно реагировать в первую очередь."
  }
];

const metrics = [
  { value: "92%", label: "точность сегментации high-risk когорты" },
  { value: "3 мин", label: "от загрузки CSV до готового дашборда" },
  { value: "18%", label: "потенциальная выручка, которую можно удержать" }
];

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    if (getStoredToken()) {
      router.replace("/dashboard");
    }
  }, [router]);

  return (
    <>
      <Nav />
      <main className="page-shell">
        <section className="hero">
          <div className="hero-copy">
            <h1>Узнайте, кто из клиентов перестанет покупать раньше, чем это случится.</h1>
            <p>
              ChurnVision превращает историю продаж в понятный прогноз оттока. Сервис подходит
              для кофеен, ресторанов, студий, локального retail и всех, кому нужно удерживать
              лояльную базу без сложных технических инструментов.
            </p>
            <div className="hero-actions">
              <Link href="/demo" className="button button-primary">
                Запустить демо
              </Link>
              <a href="#analytics" className="button button-secondary">
                Посмотреть аналитику
              </a>
            </div>
            <div className="hero-stats">
              {metrics.map((item) => (
                <div className="stat" key={item.label}>
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="hero-card">
            <div>
              <div className="eyebrow">Панель аналитики</div>
              <h3>Динамика риска оттока по сегментам</h3>
            </div>
            <div className="chart">
              <div className="chart-line" aria-hidden="true">
                <span style={{ height: "42%" }} />
                <span style={{ height: "58%" }} />
                <span style={{ height: "68%" }} />
                <span style={{ height: "50%" }} />
                <span style={{ height: "84%" }} />
                <span style={{ height: "76%" }} />
                <span style={{ height: "94%" }} />
              </div>
              <div className="mini-card-grid">
                <div className="mini-card">
                  <div className="metric-value">126</div>
                  <div>клиентов в зоне срочного удержания</div>
                </div>
                <div className="mini-card">
                  <div className="metric-value">71.4</div>
                  <div>индекс удержания по текущему месяцу</div>
                </div>
                <div className="mini-card">
                  <div className="metric-value">₽184k</div>
                  <div>потенциальная выручка под риском</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="product">
          <div className="section-header">
            <div>
              <h2>От загрузки CSV до действий маркетинга</h2>
            </div>
            <p>
              Продукт специально собран для команд без BI-отдела: один файл на входе, понятные
              метрики и конкретные рекомендации на выходе.
            </p>
          </div>
          <div className="feature-grid">
            {featureCards.map((item) => (
              <div className="feature-card" key={item.title}>
                <h3>{item.title}</h3>
                <p className="panel-copy">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="section" id="analytics">
          <div className="section-card">
            <div className="section-header">
              <div>
                <h2>Что видит владелец бизнеса</h2>
              </div>
              <p>
                Сервис не просто строит вероятность оттока, а показывает, на какой когорте теряется
                будущая выручка и кого стоит возвращать персональными офферами.
              </p>
            </div>
            <div className="metrics-grid metrics-grid-3">
              <div className="metric-card">
                <div className="metric-value">Высокий риск</div>
                <p className="panel-copy">
                  Список клиентов с максимальным риском ухода и рекомендацией по срочному касанию.
                </p>
              </div>
              <div className="metric-card">
                <div className="metric-value">Когорты</div>
                <p className="panel-copy">
                  Сегментация по активности, среднему чеку и давности последней покупки.
                </p>
              </div>
              <div className="metric-card">
                <div className="metric-value">Выручка под риском</div>
                <p className="panel-copy">
                  Оценка потенциальной выручки, которую можно вернуть ретеншн-кампанией.
                </p>
              </div>
            </div>
          </div>
        </section>

      </main>
    </>
  );
}
