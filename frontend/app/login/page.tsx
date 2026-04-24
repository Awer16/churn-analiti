import { AuthForm } from "@/components/auth-form";
import { Nav } from "@/components/nav";

export default function LoginPage() {
  return (
    <>
      <Nav />
      <main className="page-shell auth-layout">
        <div className="auth-grid">
          <AuthForm mode="login" />
          <div className="auth-card">
            <div className="eyebrow">Аналитика оттока</div>
            <h2 className="dashboard-title">Вернитесь к текущей картине риска по клиентской базе.</h2>
            <p className="panel-copy">
              Дашборд показывает последнюю загрузку, среднюю вероятность оттока, выручку под риском
              и список клиентов, с которыми команде нужно работать в первую очередь.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
