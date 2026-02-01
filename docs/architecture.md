# Frontend Architecture

## API layer
- `src/api/http.ts` wraps `fetch` with `credentials: "include"` and parses the backend error schema.
- `httpWithRetry` retries once on `401` by calling the refresh flow.
- `src/api/auth.ts` implements `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout` exactly as documented.

## Auth state
- `src/auth/auth-context.tsx` owns `accessToken` and `isHydrating`.
- On mount, it calls `/auth/refresh` once to populate the access token from the refresh cookie.
- It exposes `authedRequest` for authenticated calls that can refresh + retry once.

## Route protection
- `src/auth/require-auth.tsx` blocks protected routes until hydration completes.
- Unauthenticated users are redirected to `/login`.

## Debug connection page
- `src/pages/debug-connection-page.tsx` calls `GET /users/me` using `authedRequest` and displays the response/error.
- It surfaces the current API base URL and session actions for quick verification.

## UI system
- UI uses shadcn/ui components (Button, Card, Input, Label, Toast, Tabs, Dialog, Dropdown Menu).
- Global styles and Tailwind tokens live in `src/index.css` and `tailwind.config.ts`.
