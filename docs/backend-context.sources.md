runbook.md - Local base URL, Swagger/OpenAPI URLs, auth curl usage, CORS/cookie local notes, secret headers in smoke tests
reference/openapi.md - Swagger UI and OpenAPI JSON routes
modules/auth.md - Auth endpoints, login/refresh response shape, refresh cookie name and flags
modules/users.md - /users/me endpoint and auth requirement
modules/catalog.md - Catalog public and seller/admin endpoints + query params
modules/billing.md - Billing plans/subscriptions endpoints and auth requirements
modules/payments-mock.md - Subscribe flow + mock payment endpoints and x-mock-payment-secret header
modules/keys.md - API keys endpoints and auth requirements
modules/usage.md - Usage endpoints, x-usage-secret header, and error codes
modules/admin.md - Admin moderation endpoints and auth requirement
reference/error-codes.md - Unified error schema and code list
reference/environment.md - Env var names, required/optional, and usage (CORS_ORIGINS, COOKIE_*, JWT TTLs, PORT, secrets)
project-overview.md - Access vs refresh description; secret headers for mock payment and usage ingest
BACKEND_SPEC.md - CORS with credentials, error format, /api and /openapi.json
quality-checklist.md - Cookie secure/sameSite notes and error format reminder
