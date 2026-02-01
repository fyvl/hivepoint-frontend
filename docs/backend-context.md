# Backend Context (Source of Truth)
## Quick links (as documented)
- Backend base URL (local): http://localhost:3000
- Swagger UI: /api
- OpenAPI JSON: /openapi.json

## Frontend API endpoints (documented)
- Health: `GET /health`.
- Auth (public): `POST /auth/register`, `POST /auth/login`.
- Auth (cookie): `POST /auth/refresh`, `POST /auth/logout` (uses `refreshToken` cookie).
- Users: `GET /users/me` (Bearer).
- Catalog (public): `GET /catalog/products` (query `search`, `category`, `limit`, `offset`), `GET /catalog/products/:id` (optional Bearer), `GET /catalog/products/:id/versions` (optional Bearer).
- Catalog (seller/admin): `POST /catalog/products`, `PATCH /catalog/products/:id`, `POST /catalog/products/:id/versions`, `PATCH /catalog/versions/:versionId` (Bearer + `SELLER`/`ADMIN`).
- Billing (plans): `GET /billing/plans` (public; query `productId`), `POST /billing/plans` (Bearer + `SELLER`/`ADMIN`).
- Billing (subscriptions): `GET /billing/subscriptions` (Bearer), `POST /billing/subscriptions/:id/cancel` (Bearer, owner/admin).
- Billing (subscribe + mock): `POST /billing/subscribe` (Bearer), `POST /billing/mock/succeed` and `POST /billing/mock/fail` (require `x-mock-payment-secret`).
- Keys: `POST /keys`, `GET /keys`, `POST /keys/:id/revoke` (Bearer).
- Usage: `POST /usage/record` (requires `x-usage-secret`), `GET /usage/summary` (Bearer).
- Admin (admin only): `POST /admin/products/:id/hide`, `POST /admin/versions/:id/hide`, `POST /admin/keys/:id/revoke`.

## Authentication model
- Access token: JWT returned in the response body as `{ "accessToken": "jwt-access-token" }` on `/auth/login` and `/auth/refresh`; includes `sub`, `email`, `role` and TTL from `JWT_ACCESS_TTL_SECONDS`.
- Refresh token: JWT stored as an httpOnly cookie named `refreshToken`; `/auth/refresh` rotates and resets the cookie (request has no body); `/auth/logout` clears the cookie.
- Cookie settings (refreshToken): `httpOnly: true`, `sameSite: lax`, `secure: COOKIE_SECURE`, `domain: COOKIE_DOMAIN` (if set), `path: /`, `maxAge: JWT_REFRESH_TTL_SECONDS * 1000`.
- Required frontend request settings: `Authorization: Bearer <accessToken>` for bearer-protected endpoints; `/auth/refresh` and `/auth/logout` rely on the `refreshToken` cookie.
- Refresh strategy suggestion: Use `/auth/refresh` (no body) with the `refreshToken` cookie to obtain a new `{ accessToken }` and rotate the refresh cookie.

## Error format
- Unified error schema (exact JSON shape):
```json
{
  "error": {
    "code": "...",
    "message": "...",
    "details": {}
  }
}
```
- Typical codes (docs list many; examples): `INTERNAL_ERROR`, `HTTP_ERROR`, `BAD_REQUEST`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `VALIDATION_ERROR`, `PRODUCT_NOT_FOUND`, `PLAN_NOT_FOUND`, `INVOICE_NOT_FOUND`, `ALREADY_SUBSCRIBED`, `SUBSCRIPTION_PENDING`, `MOCK_PAYMENT_FORBIDDEN`, `USAGE_INGEST_FORBIDDEN`, `SUBSCRIPTION_NOT_FOUND`, `SUBSCRIPTION_NOT_ACTIVE`.

## Security-sensitive headers (if any)
- Mock payment: `x-mock-payment-secret` header; value must match `MOCK_PAYMENT_SECRET` (guards `/billing/mock/*`).
- Usage ingest: `x-usage-secret` header; value must match `USAGE_INGEST_SECRET` (guards `/usage/record`).
- Any other internal secrets mentioned in docs: `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `API_KEY_SALT` (environment secrets, not headers).

## Environment variables relevant to FE-BE integration
List only variables affecting frontend integration:
- `PORT` - Optional (default 3000) - backend listen port; also used by mock payment link builder.
- `CORS_ORIGINS` - Required - comma-separated list of allowed origins (example in docs: `http://localhost:5173`).
- `COOKIE_DOMAIN` - Optional - refresh cookie domain in `AuthController`.
- `COOKIE_SECURE` - Optional (default false) - refresh cookie `secure` flag in `AuthController`; runbook says `false` for local HTTP.
- `JWT_ACCESS_TTL_SECONDS` - Required - access token TTL in `AuthService`.
- `JWT_REFRESH_TTL_SECONDS` - Required - refresh token TTL; refresh cookie max-age.
- `MOCK_PAYMENT_SECRET` - Required - secret for `x-mock-payment-secret` on mock payment endpoints.
- `USAGE_INGEST_SECRET` - Required - secret for `x-usage-secret` on usage ingestion.

## CORS & cookies notes
- Allowed origins format: `CORS_ORIGINS` is a comma-separated list of origins (example: `http://localhost:5173`).
- Credentials requirement: CORS is enabled with credentials; origins are parsed from `CORS_ORIGINS`.
- Cookie secure/sameSite notes for local dev: refresh cookie is `httpOnly` with `sameSite=lax`; runbook says `COOKIE_SECURE=false` for local HTTP and `COOKIE_DOMAIN` empty for local HTTP; checklist calls for `COOKIE_SECURE=true` in production.

## Unknowns / Not specified
- None. All requested items were found in the backend docs listed in `docs/backend-context.sources.md`.
