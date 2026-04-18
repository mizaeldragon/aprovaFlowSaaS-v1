# AprovaFlow SaaS

Monorepo com frontend (React + Vite) e backend (Node + Express + Prisma).

## Estrutura

- `frontend/`: aplicacao web
- `backend/`: API, auth, regras de negocio, socket e Prisma

## Requisitos

- Node.js 20+
- npm 10+
- PostgreSQL

## Setup rapido

### Backend

```bash
cd backend
npm install
copy .env.example .env
npm run prisma:generate
npm run prisma:push
npm run dev
```

Variaveis obrigatorias no `backend/.env`:

- `DATABASE_URL`
- `JWT_SECRET`
- `FRONTEND_URL`
- `CORS_ALLOWED_ORIGINS`
- SMTP (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`) para recuperacao de senha

### Frontend

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Variavel obrigatoria no `frontend/.env`:

- `VITE_API_URL` (ex.: `http://localhost:3000/api`)

## Scripts

### Frontend

- `npm run dev`
- `npm run lint`
- `npm run build`

### Backend

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run prisma:generate`
- `npm run prisma:push`

## Stripe

Configure no `backend/.env`:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_PRO_MONTHLY`
- `STRIPE_PRICE_PRO_YEARLY` (opcional)
- `FRONTEND_URL`

Endpoints:

- `POST /api/billing/checkout-session`
- `POST /api/billing/portal-session`
- `POST /api/billing/webhook`
