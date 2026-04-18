# Evolucao do AprovaFlow para SaaS (PostgreSQL + IA)

Objetivo: transformar o MVP em um SaaS escalavel com backend Node.js + Prisma + PostgreSQL e recursos de IA para aumentar produtividade.

## 1. IA no AprovaFlow

A IA agrega valor real no fluxo de aprovacao:

1. AI Copy Assistant: melhora legenda antes do envio.
2. AI Feedback Summarizer: transforma comentarios em checklist.
3. AI Vision: analisa criativo e alerta problemas visuais.

## 2. Arquitetura SaaS

- Frontend: React + Vite + Tailwind
- Backend: Node.js + Express
- Banco: PostgreSQL
- ORM: Prisma
- IA: OpenAI API

### Modelo de dados central

- Tenant
- User
- Client
- Post
- Comment
- Subscription

## 3. Fases

### Fase 1: Fundacao
- Estruturar backend
- Criar migrations iniciais
- Integrar API com frontend

### Fase 2: IA
- `/api/ai/improve-copy`
- `/api/ai/summarize-feedback`
- UI com botoes de IA

### Fase 3: Billing
- Integrar Stripe/Asaas
- Liberar features por plano

## Proxima decisao

Escolher a primeira feature de IA para priorizar no roadmap.
