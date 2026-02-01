# HivePoint Frontend

## Prerequisites
- Node.js (LTS recommended)
- HivePoint backend running (default: http://localhost:3000)

## Setup
```bash
npm install
cp .env.example .env
```

## Run
```bash
npm run dev
```

Default app routes:
- http://localhost:5173/ (dashboard)
- http://localhost:5173/catalog
- http://localhost:5173/products/:id
- http://localhost:5173/login
- http://localhost:5173/register
- http://localhost:5173/debug/connection

Protected routes (auth required):
- http://localhost:5173/billing
- http://localhost:5173/keys
- http://localhost:5173/usage

## API types (OpenAPI)
When the backend is running and serving `/openapi.json`:
```bash
npm run api:generate
```
Generated types are committed at `src/api/generated/schema.d.ts`.

## Dev-only mock payments
In DEV mode, the subscribe dialog exposes mock payment buttons.
You must provide `MOCK_PAYMENT_SECRET` (from backend env) for:
- POST /billing/mock/succeed?invoiceId=...
- POST /billing/mock/fail?invoiceId=...

See `docs/frontend-runbook.md` for more details.

## Debug connection page
Use http://localhost:5173/debug/connection to verify:
- API base URL and current user call
- cookies + bearer auth wiring
If you get a 401, confirm backend is running and cookies are allowed.
