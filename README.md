# AprovaFlow SaaS

Monorepo com frontend (React + Vite) e backend (Node + Express + Prisma).

## Estrutura

- `frontend/`: aplicação web
- `backend/`: API, auth, regras de negócio, socket e Prisma

## Requisitos

- Node.js 20+
- npm 10+
- PostgreSQL

## Configuração rápida

### 1) Backend

```bash
cd backend
npm install
copy .env.example .env
```

Preencha no `.env`:

- `DATABASE_URL`
- `JWT_SECRET`
- `FRONTEND_URL`
- `CORS_ALLOWED_ORIGINS`
- SMTP (`SMTP_HOST`, `SMTP_USER`, etc.) para recuperação de senha

Comandos:

```bash
npm run prisma:generate
npm run prisma:push
npm run dev
```

### 2) Frontend

```bash
cd frontend
npm install
copy .env.example .env
```

Preencha no `.env`:

- `VITE_API_URL` (ex.: `http://localhost:3000/api`)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Comandos:

```bash
npm run dev
```

## Scripts principais

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

## Regras de produção aplicadas

- JWT obrigatório em produção (`JWT_SECRET`).
- CORS por whitelist (`CORS_ALLOWED_ORIGINS`).
- `FRONTEND_URL` obrigatório em produção para links de reset.
- Fluxo de "esqueci senha" com resposta genérica (não expõe existência de conta).

## Checklist de qualidade

```bash
# frontend
npm run lint
npm run build

# backend
npm run build
npx tsc --noEmit
npm run prisma:generate
npm run prisma:push
```

## Stripe (producao)

Configure no backend/.env:
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- STRIPE_PRICE_PRO_MONTHLY
- STRIPE_PRICE_PRO_YEARLY (opcional)
- FRONTEND_URL

Fluxo implementado:
- POST /api/billing/checkout-session
- POST /api/billing/portal-session
- POST /api/billing/webhook

Teste local de webhook:
`stripe listen --forward-to localhost:3000/api/billing/webhook`
