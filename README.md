# Katana Finance API

API de NestJS + TypeORM + PostgreSQL para Katana Finance.

## Setup

```bash
npm install
cp .env.example .env   # completar valores (JWT_SECRET: openssl rand -hex 32)
npm run start:dev      # http://localhost:3001
```

Necesita un Postgres con los datos del `.env`. Si no tenés uno instalado:
`docker compose up -d db`.

## Tests

```bash
npm test                         # unit
docker compose up -d db-test     # Postgres descartable en el puerto 5440
npm run test:e2e                 # e2e contra esa base (la borra y recrea en cada corrida)
```

## Endpoints

Todos menos `/health`, `/auth/*` y `/bot/*` requieren `Authorization: Bearer <token>`.

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/health` | Health check |
| POST | `/auth/signup` | `{ name, email, password }` → `{ access_token, user }` |
| POST | `/auth/login` | `{ email, password }` → `{ access_token, user }` |
| GET | `/auth/google` | Login con Google; vuelve a `FRONTEND_URL/auth/callback#token=...` |
| GET / PATCH | `/users/me` | Perfil (`name`, `currency`) |
| POST | `/users/me/link-code` | Código de 6 dígitos (10 min) para vincular el bot |
| DELETE | `/users/me/link/:platform` | Desvincular `whatsapp` o `telegram` |
| GET | `/transactions` | Filtros: `from`, `to`, `type`, `category`, `search`, `limit`, `offset` |
| GET | `/transactions/summary?month=YYYY-MM` | Ingresos, gastos, balance y gastos por categoría |
| POST / GET / PATCH / DELETE | `/transactions[/:id]` | CRUD |
| GET | `/budgets?month=YYYY-MM` | Presupuestos con `spent` y `remaining` |
| POST / PATCH / DELETE | `/budgets[/:id]` | CRUD |

## Bot (n8n)

Los endpoints `/bot/*` usan el header `x-api-key: <BOT_API_KEY>` en vez de JWT.

1. El usuario genera un código en la app (`POST /users/me/link-code`) y se lo manda al bot.
2. n8n llama `POST /bot/link` con `{ platform: "whatsapp" | "telegram", senderId, code }`.
3. Desde ahí n8n puede usar:
   - `POST /bot/transactions` con `{ platform, senderId, type, amount, category, description?, date? }`
   - `GET /bot/summary?platform=...&senderId=...` (resumen del mes actual)

## Producción

- `DB_SYNC=false` (usar migraciones de TypeORM: `synchronize` puede borrar columnas).
- `JWT_SECRET` y `BOT_API_KEY` propios y largos; `FRONTEND_URL` con el dominio real (CORS).
