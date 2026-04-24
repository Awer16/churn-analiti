# ChurnVision — Информация о проекте

## Общее описание
Сервис предиктивной аналитики оттока для малого бизнеса (кофейни, рестораны, студии, retail). Пользователь загружает CSV с историей продаж, ML-модель прогнозирует риск ухода каждого клиента, дашборд показывает метрики и рекомендации.

## Стек технологий

### Frontend
- **Next.js 15** (App Router) — серверный рендеринг, маршрутизация
- **React 19** — UI-компоненты
- **TypeScript** — типизация
- **CSS Variables** — тёмная/светлая тема, адаптивный дизайн

### Backend
- **FastAPI** — REST API
- **SQLAlchemy 2.0** — ORM для PostgreSQL
- **Pydantic** — валидация схем запросов/ответов
- **scikit-learn** — Gradient Boosting Classifier для прогнозирования
- **numpy** — матричные операции
- **PyJWT** — JWT-токены
- **passlib** — хеширование паролей

### База данных
- **PostgreSQL 16** — хранение пользователей, загрузок, результатов

### Инфраструктура
- **Docker** — контейнеризация
- **Docker Compose** — оркестрация сервисов

## Архитектура

```
Browser → Next.js (port 3000) → API Proxy → FastAPI (port 8000) → PostgreSQL
                                    ↓
                            ML-модель (Gradient Boosting)
```

### Ключевые компоненты

| Файл | Описание |
|---|---|
| `backend/app/ml/churn_model.py` | ML-модель: обучение на синтетических данных, предсказание, feature importance |
| `backend/app/api/routes_analytics.py` | Эндпоинты загрузки CSV и получения результатов |
| `backend/app/services/analytics.py` | Бизнес-логика: обработка CSV, расчёт метрик, сохранение в БД |
| `frontend/app/dashboard/page.tsx` | Личный кабинет с загрузкой и визуализацией |
| `frontend/components/dashboard-client.tsx` | Клиентский компонент дашборда (загрузка, метрики, таблица, feature importance) |
| `frontend/app/api/[...path]/route.ts` | Прокси-роут для перенаправления запросов к backend |

## ML-модель

### Алгоритм
- **Gradient Boosting Classifier** (150 деревьев, max_depth=4, learning_rate=0.1)
- Обучается на 15 000 синтетических записей при первом запуске
- Сохраняется в `backend/app/ml/trained_model/churn_model.pkl`
- StandardScaler для нормализации признаков

### Признаки
1. Давность последней покупки (вес ~49%)
2. Общая сумма покупок (вес ~20%)
3. Частота визитов (вес ~15%)
4. Средний чек (вес ~9%)
5. Длительность истории (вес ~6%)
6. Количество покупок (вес ~1%)

### Генерация синтетических данных
- Экспоненциальное распределение для давности покупки
- Пуассоновское распределение для количества покупок
- Логистическая функция для расчёта вероятности оттока
- Реалистичные корреляции между признаками

## Рекомендации по удержанию

### Высокий риск (≥ 0.7)
- Срочное персональное касание в течение 72 часов
- Персональная скидка или бонус
- Эксклюзивный оффер

### Средний риск (0.4–0.7)
- Кампания лояльности
- Мягкий ремаркетинг
- Email-рассылка, push-уведомления
- Небольшие бонусы

### Низкий риск (< 0.4)
- Стандартная коммуникация
- Программа лояльности для вовлечения
- Мониторинг активности

## Формат CSV

### Обязательные колонки
- `customer_id` — идентификатор клиента
- `order_date` — дата покупки (YYYY-MM-DD, DD.MM.YYYY, YYYY/MM/DD)
- `amount` — сумма покупки

### Опциональные колонки
- `visits` — количество визитов
- `channel` — канал продаж (offline, delivery, online)
- `product_category` — категория товара

## Развёртывание

### Локальная разработка
```bash
# PostgreSQL
docker run --name churnvision-postgres -e POSTGRES_DB=churnvision \
  -e POSTGRES_USER=churnvision -e POSTGRES_PASSWORD=churnvision \
  -p 5432:5432 -d postgres:16

# Backend
cd backend && uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend && npm run dev
```

### Docker Compose (production)
```bash
docker compose up -d --build
```

### VPS
- Docker + Docker Compose
- Nginx/Caddy как reverse proxy перед port 3000
- PostgreSQL только внутри docker-сети
- `.env` с реальными SECRET_KEY

## Переменные окружения

| Переменная | Где | Описание |
|---|---|---|
| `DATABASE_URL` | Backend | `postgresql+psycopg://user:pass@host:port/db` |
| `SECRET_KEY` | Backend | Ключ для JWT-подписи |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Backend | Время жизни токена (по умолчанию 1440) |
| `FRONTEND_ORIGIN` | Backend | Origin для CORS |
| `BACKEND_INTERNAL_URL` | Frontend | Внутренний URL backend в Docker-сети |
