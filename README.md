# ChurnVision

Веб-сервис для предиктивной аналитики оттока клиентов малого бизнеса. Пользователь регистрируется, загружает CSV с историей продаж, а backend на основе ML-модели (Gradient Boosting) прогнозирует риск ухода каждого клиента.

## Возможности

- Лендинг с описанием продукта и демо-режимом
- Регистрация и авторизация по JWT
- Загрузка CSV и автоматический анализ клиентской базы
- ML-модель Gradient Boosting для прогнозирования оттока
- Дашборд с метриками: индекс удержания, выручка под риском, сегментация по уровню риска
- Визуализация важности признаков модели (понятные русские названия)
- Персонализированные рекомендации по удержанию для каждого клиента
- Страница профиля с историей загрузок
- Тёмная и светлая тема
- Адаптивный дизайн для мобильных устройств

## Стек

| Слой | Технология |
|---|---|
| Frontend | Next.js 15 (App Router), React 19, TypeScript |
| Backend | FastAPI, SQLAlchemy, Pydantic |
| База данных | PostgreSQL 16 |
| ML-модель | Gradient Boosting Classifier (scikit-learn) |
| Инфраструктура | Docker, Docker Compose |
| Стилизация | CSS Variables (тёмная/светлая тема) |

## Структура проекта

```
churn-vision/
├── backend/
│   ├── app/
│   │   ├── api/          — маршруты (auth, analytics)
│   │   ├── core/         — конфиг, безопасность (JWT, хеширование)
│   │   ├── db/           — модели SQLAlchemy, сессия
│   │   ├── ml/           — ML-модель (Gradient Boosting)
│   │   ├── schemas/      — Pydantic-схемы запросов/ответов
│   │   └── services/     — бизнес-логика
│   ├── data/             — демо-данные (test CSV)
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── app/
│   │   ├── api/[...path]/ — прокси-роут к backend
│   │   ├── dashboard/     — личный кабинет
│   │   ├── demo/          — демо-режим
│   │   ├── login/         — страница входа
│   │   ├── profile/       — профиль пользователя
│   │   ├── register/      — страница регистрации
│   │   └── page.tsx       — лендинг
│   ├── components/        — переиспользуемые компоненты
│   ├── lib/               — утилиты (API, сессия)
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
├── .env.example
├── README.md
└── PROJECT_INFO.md
```

## Быстрый старт (локально)

1. Скопировать `.env.example` в `.env`
2. Запустить PostgreSQL:

```bash
docker run --name churnvision-postgres \
  -e POSTGRES_DB=churnvision \
  -e POSTGRES_USER=churnvision \
  -e POSTGRES_PASSWORD=churnvision \
  -p 5432:5432 -d postgres:16
```

3. Запустить backend:

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

4. Запустить frontend:

```bash
cd frontend
npm install && npm run dev
```

5. Открыть `http://localhost:3000`

## Запуск в Docker

1. Создать сеть:

```bash
docker network create churnvision-net
```

2. Собрать образы:

```bash
docker build -t churnvision-backend ./backend
docker build -t churnvision-frontend ./frontend
```

3. Запустить контейнеры:

```bash
docker run -d --name churnvision-postgres --network churnvision-net \
  -e POSTGRES_DB=churnvision -e POSTGRES_USER=churnvision \
  -e POSTGRES_PASSWORD=churnvision -p 5432:5432 postgres:16

docker run -d --name churnvision-backend --network churnvision-net \
  -e DATABASE_URL=postgresql+psycopg://churnvision:churnvision@churnvision-postgres:5432/churnvision \
  -e SECRET_KEY=change-me -e ACCESS_TOKEN_EXPIRE_MINUTES=1440 \
  -e FRONTEND_ORIGIN=http://localhost:3000 churnvision-backend

docker run -d --name churnvision-frontend --network churnvision-net \
  -e BACKEND_INTERNAL_URL=http://churnvision-backend:8000 \
  -p 3000:3000 churnvision-frontend
```

## Формат CSV

Обязательные столбцы:

- `customer_id` — идентификатор клиента
- `order_date` — дата покупки (YYYY-MM-DD, DD.MM.YYYY, YYYY/MM/DD)
- `amount` — сумма покупки

Необязательные столбцы:

- `visits` — количество визитов
- `channel` — канал продаж (offline, delivery, online)
- `product_category` — категория товара
# churn-analiti
