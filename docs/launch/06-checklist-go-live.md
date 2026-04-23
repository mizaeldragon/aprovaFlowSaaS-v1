# Checklist Go-Live (Venda)

## Produto
- [ ] Landing com CTA correto.
- [ ] Planos Starter/Pro/Enterprise corretos.
- [ ] Termos e Privacidade publicados.

## Billing
- [ ] `STRIPE_SECRET_KEY` em producao.
- [ ] `STRIPE_WEBHOOK_SECRET` em producao.
- [ ] `STRIPE_PRICE_STARTER_MONTHLY` em producao.
- [ ] `STRIPE_PRICE_PRO_MONTHLY` em producao.
- [ ] Webhook Stripe apontando para backend.

## Banco
- [ ] Coluna `billingRequired` existe em producao.
- [ ] Consulta de tenants retorna sem erro.

## Operacao
- [ ] `OPS_ALERT_WEBHOOK_URL` ativo.
- [ ] `POST /api/ops/alert-test` enviando alerta.
- [ ] Recuperacao de senha funcionando.

## Comercial
- [ ] Script de prospeccao pronto.
- [ ] Roteiro de demo pronto.
- [ ] FAQ pronta para atendimento.

