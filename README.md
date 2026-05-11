# 2048 — Telegram Mini App

React + Vite + TypeScript SPA, играется внутри Telegram через Mini App.
Сопровождается ботом на `grammy`, который по `/start` отправляет greeting и кнопку запуска WebApp.

## Структура

```
.
├── src/                 # React приложение (Mini App)
├── bot/                 # Telegram-бот (Node.js + grammy)
├── Dockerfile           # web → multi-stage nginx
├── bot/Dockerfile       # bot → multi-stage node
├── docker-compose.yml   # для Dokploy: web + bot + Traefik
└── nginx.conf           # SPA fallback + долгий кэш для /assets
```

## Локальная разработка

```bash
npm install
npm run dev          # фронтенд на http://localhost:5173

cd bot && npm install
BOT_TOKEN=... WEB_APP_URL=https://your-tunnel.example npm run dev
```

## Деплой через Dokploy

Сборка происходит на VPS силами Dokploy — никаких внешних реестров.
BuildKit и слои Docker переиспользуются между деплоями, так что после первого
билда последующие занимают секунды (если не менялся `package-lock.json`).

1. **DNS** — направь `A`-запись поддомена (`2048.example.com`) на IP VPS.
2. **В Dokploy** → New Application → **Compose**:
   - Provider — GitHub/Git, репозиторий = этот проект, ветка `main`/`master`
   - Compose Path — `docker-compose.yml`
3. **Environment** (вкладка в Dokploy) — заполни по `.env.example`:

   | Имя | Описание |
   | --- | --- |
   | `DOMAIN` | поддомен, на который Traefik роутит web (например `2048.example.com`) |
   | `BOT_TOKEN` | токен от [@BotFather](https://t.me/BotFather) |
   | `WEB_APP_URL` | публичный https-URL Mini App, обычно `https://${DOMAIN}` |
   | `DATABASE_URL` | Postgres connection string для бота (опционально) |

4. **Domain** — Dokploy сам подхватит Traefik labels из compose. Если домен
   добавляешь через UI Dokploy — оставь его таким же, как `DOMAIN`,
   и убедись, что выбран сервис `web` и порт `80`.
5. **Auto Deploy** — включи в Dokploy webhook на GitHub: каждый push в ветку
   будет триггерить `docker compose up -d --build` на VPS.

### Настройка Mini App в @BotFather

После первого деплоя:
1. `/setmenubutton` → выбери бота → URL = `https://${DOMAIN}` → текст «Играть»
2. `/setdomain` → укажи `${DOMAIN}` (нужно для inline `web_app` кнопок)
3. Напиши боту `/start` — придёт greeting с кнопкой запуска игры.

## Почему билд быстрый

- Многостадийные Dockerfile: deps → build → runtime, рантайм-образ содержит только финальный артефакт
- `--mount=type=cache,target=/root/.npm` в `npm ci` → кэш npm не теряется между билдами
- Прод-зависимости бота ставятся отдельной стадией `prod-deps`, dev-зависимости в финальный образ не попадают
- `.dockerignore` исключает `node_modules`, `dist`, `bot/`, `.git`
- nginx с `immutable`-кэшем для `/assets/*` и SPA-fallback на `/index.html`
