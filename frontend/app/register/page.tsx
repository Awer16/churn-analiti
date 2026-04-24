import { AuthForm } from "@/components/auth-form";
import { Nav } from "@/components/nav";

export default function RegisterPage() {
  return (
    <>
      <Nav />
      <main className="page-shell auth-layout">
        <div className="auth-grid">
          <AuthForm mode="register" />
          <div className="auth-card">
            <div className="eyebrow">Что будет дальше</div>
            <h2 className="dashboard-title">Первые инсайты по оттоку за один файл.</h2>
            <p className="panel-copy">
              После регистрации вы сможете загрузить CSV с продажами, получить индекс удержания,
              распределение клиентов по риску и список контактов, которым нужен персональный оффер.
            </p>
            <div className="mini-card-grid">
              <div className="mini-card">
                <div className="metric-value">1</div>
                <div>Регистрация компании</div>
              </div>
              <div className="mini-card">
                <div className="metric-value">2</div>
                <div>Загрузка CSV истории продаж</div>
              </div>
              <div className="mini-card">
                <div className="metric-value">3</div>
                <div>Прогноз ухода и решения по удержанию</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
