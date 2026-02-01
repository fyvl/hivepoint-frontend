# Frontend Architecture

## API layer
- `src/api/http.ts` wraps `fetch` with `credentials: "include"` and parses the backend error schema.
- `httpWithRetry` retries once on `401` by calling the refresh flow.
- `src/api/auth.ts` implements `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout` exactly as documented.
- `src/api/catalog.ts` implements catalog endpoints using OpenAPI-derived types for `/catalog/products`, `/catalog/products/{id}`, `/catalog/products/{id}/versions`.
- `src/api/billing.ts` implements plan listing, subscribe, subscription list/cancel, and DEV mock payment helpers using OpenAPI-derived types.
- `src/api/keys.ts` implements key creation, listing, and revocation using OpenAPI-derived types.
- `src/api/usage.ts` implements usage summary plus DEV usage ingestion helpers using OpenAPI-derived types.
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

## App shell and routing
- `src/components/layout/app-shell.tsx` provides the shared header, sidebar nav, and main layout.
- `src/pages/dashboard/dashboard-page.tsx` renders `/` with quick actions.
- `src/pages/not-found/not-found-page.tsx` renders `*` for unknown routes.
- `src/components/error-boundary.tsx` wraps the app to show a friendly fallback on runtime errors.

## Theme
- `src/theme/theme.ts` applies the `dark` class on `<html>` and persists the theme in localStorage.
- `src/theme/theme-context.tsx` provides theme state and listens for system theme changes.

## UI state blocks
- `src/components/ui-states/loading-block.tsx` standardizes loading skeletons.
- `src/components/ui-states/empty-block.tsx` standardizes empty states.
- `src/components/ui-states/error-block.tsx` standardizes error states with retry actions.
- `src/components/copy-button.tsx` centralizes copy-to-clipboard behavior with toasts.
- `src/components/status-badge.tsx` renders consistent status badges across the app.
- `src/lib/notify.ts` provides centralized toast helpers for success/error/info.
- `src/components/skeletons/*` holds page-level skeleton loaders for major screens.

## Debug connection page
- `src/pages/debug-connection-page.tsx` calls `GET /users/me` using the typed `src/api/users.ts` wrapper and displays the response/error.
- It surfaces the current API base URL and session actions for quick verification.

## Catalog UI
- `src/pages/catalog/catalog-page.tsx` renders `/catalog` with search, category, and pagination.
- `src/pages/catalog/product-details-page.tsx` renders `/products/:id` with product details and versions.
- `src/pages/billing/billing-page.tsx` renders `/billing` with subscriptions and cancel actions.
- `src/pages/billing/dev-mock-payment.tsx` renders DEV-only mock payment controls in the subscribe dialog.
- `src/pages/keys/keys-page.tsx` renders `/keys` with key creation, listing, and revocation.
- `src/pages/usage/usage-page.tsx` renders `/usage` with per-subscription usage cards and DEV ingest tools.

## UI system
- UI uses shadcn/ui components (Button, Card, Input, Label, Toast, Tabs, Dialog, Dropdown Menu, Badge, Separator, Skeleton).
- Global styles and Tailwind tokens live in `src/index.css` and `tailwind.config.ts`.
