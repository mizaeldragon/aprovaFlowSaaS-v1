# AprovaFlow Frontend

Frontend React + Vite do AprovaFlow.

## Requisitos

- Node.js 20+
- npm 10+

## Ambiente

Crie `frontend/.env` com:

```env
VITE_API_URL=http://localhost:3000/api
```

## Execucao

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Observacao

Uploads de imagem sao processados localmente em data URL e enviados para API junto aos dados do post/configuracao.
