# Frontend Architecture

## API layer
- `src/api/http.ts` wraps `fetch` with `credentials: "include"` and parses the backend error schema.
- `httpWithRetry` retries once on `401` by calling the refresh flow.
- `src/api/auth.ts` implements `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout` exactly as documented.
- `src/api/catalog.ts` implements catalog endpoints using OpenAPI-derived types for `/catalog/products`, `/catalog/products/{id}`, `/catalog/products/{id}/versions`.
- `src/api/billing.ts` implements plan listing, subscribe, subscription list/cancel, and DEV mock payment helpers using OpenAPI-derived types.
- `src/api/keys.ts` implements key creation, listing, and revocation using OpenAPI-derived types.
- `src/api/generated/schema.d.ts` is generated from OpenAPI (`/openapi.json`) via `openapi-typescript`.
- `src/api/types.ts` provides helper types for schema-derived request/response typing.
- `src/api/users.ts` wraps `/users/me` with typed request/response shapes.

## Auth state
- `src/auth/auth-context.tsx` owns `accessToken` and `isHydrating`.
- On mount, it calls `/auth/refresh` once to populate the access token from the refresh cookie.
- It exposes `authedRequest` for authenticated calls that can refresh + retry once.

## Route protection
- `src/auth/require-auth.tsx` blocks protected routes until hydration completes.
- Unauthenticated users are redirected to `/login`.

## Debug connection page
- `src/pages/debug-connection-page.tsx` calls `GET /users/me` using the typed `src/api/users.ts` wrapper and displays the response/error.
- It surfaces the current API base URL and session actions for quick verification.

## Catalog UI
- `src/pages/catalog/catalog-page.tsx` renders `/catalog` with search, category, and pagination.
- `src/pages/catalog/product-details-page.tsx` renders `/products/:id` with product details and versions.
- `src/pages/billing/billing-page.tsx` renders `/billing` with subscriptions and cancel actions.
- `src/pages/billing/dev-mock-payment.tsx` renders DEV-only mock payment controls in the subscribe dialog.
- `src/pages/keys/keys-page.tsx` renders `/keys` with key creation, listing, and revocation.

## UI system
- UI uses shadcn/ui components (Button, Card, Input, Label, Toast, Tabs, Dialog, Dropdown Menu, Badge).
- Global styles and Tailwind tokens live in `src/index.css` and `tailwind.config.ts`.
