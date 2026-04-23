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
- `STRIPE_PRICE_STARTER_MONTHLY`
- `STRIPE_PRICE_STARTER_YEARLY` (opcional)
- `STRIPE_PRICE_PRO_MONTHLY`
- `STRIPE_PRICE_PRO_YEARLY` (opcional)
- `FRONTEND_URL`
- `OPS_ALERT_WEBHOOK_URL` (opcional, alertas de erro backend)

Endpoints:

- `POST /api/billing/checkout-session`
- `POST /api/billing/portal-session`
- `POST /api/billing/webhook`
- `GET /api/billing/status`
- `GET /api/ops/health`

Payload de checkout:

- `POST /api/billing/checkout-session` aceita `plan: "starter" | "pro"` e `interval: "monthly" | "yearly"`.

## Checklist de deploy (ordem recomendada)

1. Defina todas as variaveis de ambiente em backend/frontend (sem chaves hardcoded no codigo).
2. Suba backend e frontend em producao com dominio e SSL ativos.
3. Configure webhook Stripe para `POST /api/billing/webhook` e valide assinatura (`STRIPE_WEBHOOK_SECRET`).
4. Execute pagamento real de baixo valor e confirme:
   `checkout.session.completed` recebido e `tenant.plan/isPro` atualizado.
5. Teste retorno em `/billing/success` e `/billing/cancelled`.
6. Entre no portal Stripe (`/api/billing/portal-session`) e cancele/downgrade para validar bloqueio automatico de recursos Pro.
7. Verifique monitoramento:
   - `GET /api/ops/health` retornando `status: ok`.
   - Alertas chegando no `OPS_ALERT_WEBHOOK_URL` em falhas de billing/webhook.
8. Rotacione imediatamente chaves expostas anteriormente (JWT, Stripe, OpenAI, SMTP) e atualize no provedor.
