# Frontend Runbook

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a local env file:
   ```bash
   cp .env.example .env
   ```
3. Confirm the backend base URL matches the backend docs:
   - `VITE_API_BASE_URL=http://localhost:3000`

## Run
```bash
npm run dev
```
Then visit `/catalog` to browse products. Use `/login` or `/register` and verify `/debug/connection` once authenticated.

## Integration notes
- The HTTP client always sends `credentials: "include"` so the refresh cookie can be sent.
- Access tokens come from `/auth/login` and `/auth/refresh` and are stored in memory by `AuthProvider`.
- Protected requests attach `Authorization: Bearer <accessToken>` when available.
- On app start, the auth context calls `POST /auth/refresh` once to hydrate the access token.

## Billing (dev flow)
- Go to a product page and subscribe to a plan to get a `paymentLink` + `invoiceId`.
- In DEV only, the subscribe dialog exposes mock payment buttons.
- Provide the backend `MOCK_PAYMENT_SECRET` and the UI will call:
  - `POST /billing/mock/succeed?invoiceId=...` with header `x-mock-payment-secret`
  - `POST /billing/mock/fail?invoiceId=...` with header `x-mock-payment-secret`
- After a mock succeed, refresh `/billing` to see the subscription become ACTIVE.

## API keys
- Visit `/keys` to create and manage API keys.
- The raw key is shown only once after creation; store it securely.

## Generating API types
- Ensure the backend is running locally and serves `/openapi.json`.
- Run: `npm run api:generate`
- Generated types are committed at `src/api/generated/schema.d.ts`.

## Troubleshooting
- CORS errors: ensure backend `CORS_ORIGINS` includes your frontend origin (example: `http://localhost:5173`).
- Cookies not sent: backend should use `COOKIE_SECURE=false` for local HTTP and `COOKIE_DOMAIN` empty.
- Repeated 401s: verify the refresh cookie exists and `/auth/refresh` succeeds; the client retries once after a 401.
- Wrong base URL: confirm `VITE_API_BASE_URL` matches the backend base URL documented in `docs/backend-context.md`.
