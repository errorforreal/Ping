# AGENTS.md

Repository operating guide for coding agents. Read this before making changes. It describes current ownership boundaries and the files that should be treated as starting points; source code and tests win if this guide becomes stale.

## Working Rules

- Trace behavior end to end before editing it: dashboard or caller -> route -> middleware -> controller -> service/queue -> database -> worker -> provider or webhook -> tests.
- Preserve tenant isolation. External user IDs are tenant-scoped, notification reads and writes must remain tenant-scoped, and browser sessions must not replace API-key checks on the public notification endpoint.
- Backend state is authoritative. Do not infer delivery success from a queued job, an HTTP `201`, a Twilio submission response, or dashboard presentation.
- Preserve explicit notification and delivery transitions. Do not collapse notification-level state and per-channel delivery state into one flag.
- Keep the API and worker as separate processes. Do not import `src/worker/worker.ts` from API startup or register another worker/sweeper as a module-load side effect.
- Keep provider-specific behavior behind `src/providers/` and normalize provider results in worker/webhook code rather than spreading Twilio or SMTP fields through controllers.
- Never log or return raw API keys after creation/rotation, passwords, JWTs, SMTP credentials, Twilio auth tokens, or full provider payloads. Do not inspect or print `.env` values unless configuration diagnosis explicitly requires it.
- Never hardcode credentials. Document variable names and safe examples in `.env.example`.
- Do not run migrations against a shared or production database, send real email/SMS, rotate tenant keys, or invoke other external side effects without explicit authorization and a verified environment.
- Preserve unrelated work in a dirty tree. Keep changes scoped and use the smallest implementation that satisfies the request.
- For behavior changes, update the narrowest useful tests. For documentation-only changes, use diff and formatting checks instead of unrelated builds.
- Verify current constants and source before documenting rate limits, retry counts, time windows, ports, states, or provider behavior.

## Repository and Commands

Ping is an npm repository with two applications:

```text
src/         Express API, queue producers, worker, providers, and tests
prisma/      PostgreSQL schema and migrations
dashboard/   React/Vite tenant dashboard
```

Backend commands run from the repository root:

```bash
npm install
npm run dev:api          # Express API with nodemon/tsx
npm run dev:worker       # BullMQ worker with nodemon/tsx
npm test                 # Vitest suite
npm run typecheck        # TypeScript without emit
npm run build            # Compile to dist/
npm run start:api        # Run compiled API
npm run start:worker     # Run compiled worker
npx prisma validate
npx prisma generate
npx prisma migrate dev
```

Dashboard commands:

```bash
npm --prefix dashboard install
npm --prefix dashboard run dev
npm --prefix dashboard run lint
npm --prefix dashboard run build
```

Prefer a focused test for the code touched, followed by type checking or the owning application's build when the risk warrants it. Do not use live providers as a default verification method.

## System Story: Request to Delivery

Keep this sequence intact:

1. A tenant signs up through `POST /tenant/signup`. Ping returns the raw API key once and stores only its SHA-256 hash.
2. The tenant's backend calls `POST /api/notify/v1` with `ping-api-key`.
3. API-key middleware resolves the tenant, then the Redis rate limiter applies the tenant quota.
4. The notification controller validates the payload and upserts the tenant-scoped external user and requested contact channels.
5. PostgreSQL stores one notification plus one delivery record for each requested channel.
6. The queue producer assigns a deterministic BullMQ job ID, queues the job, and updates notification state.
7. The worker loads deliveries, skips terminal/already-accepted work, and calls the channel provider.
8. Email becomes `SENT` after SMTP acceptance. SMS remains `PENDING` with its Twilio SID after provider acceptance.
9. Twilio calls `POST /api/webhooks/twilio/sms-status`; the signed callback moves SMS to `DELIVERED` or `FAILED` and reconciles the parent notification.
10. The worker-owned sweeper periodically attempts to requeue old notifications that remain `PENDING`.

Queue acceptance is not delivery confirmation. A notification may have different states across its channel deliveries.

## Composition Roots and Ownership

`src/index.ts` is the API composition root. It validates core runtime configuration, installs request/security/origin middleware, mounts routes, exposes health checks, starts Express, and closes API-owned PostgreSQL/Redis/queue resources during shutdown.

`src/worker/worker.ts` is the worker composition root. It validates provider configuration, starts the BullMQ worker, registers the recurring sweeper, and closes worker-owned resources during shutdown.

Normal backend flow is:

```text
routes -> middleware/controllers -> services/queue -> Prisma/Redis
                                            |
                                            v
                                  worker -> providers
                                            |
                                            v
                                         webhook
```

Ownership map:

| Path | Owns |
|---|---|
| `src/index.ts` | API composition, global middleware, public notify/webhook routes, health/readiness, shutdown |
| `src/routes/` | Tenant and analytics HTTP contracts and middleware order |
| `src/controller/` | Request parsing, response serialization, tenant/notification transactions, analytics, Twilio callback handling |
| `src/middleware/` | API-key and dashboard-session authentication |
| `src/services/authenticatPayload.ts` | Public notification payload contract and channel/contact matching |
| `src/services/auth.ts` | Tenant signup/login/rotation schemas, JWT creation, session-cookie names, revocation keys |
| `src/services/apiKey.ts` | Raw API-key generation and hashing inputs |
| `src/services/rateLimiter.ts` | Tenant notification and authentication rate limits |
| `src/queue/` | BullMQ connection, notification queue, job IDs, queue submission, retry defaults |
| `src/worker/notification.processor.ts` | Per-channel dispatch, retry-aware skips, and notification/delivery state changes |
| `src/worker/sweeper.ts` | Recovery scan for old parent notifications still in `PENDING` |
| `src/providers/` | SMTP and Twilio adapters plus channel dispatch map |
| `src/lib/` | Shared Prisma and Redis clients |
| `prisma/schema.prisma` | Durable models, relations, enums, uniqueness, and indexes |
| `dashboard/src/` | Tenant browser UI, session-based account access, analytics, docs, and key rotation |

Controllers currently contain some transaction orchestration. Do not introduce a speculative service layer for small changes; extract logic only when reuse, testing, or complexity justifies it.

## HTTP Boundaries

Routes mounted directly in `src/index.ts`:

| Route | Authentication | Responsibility |
|---|---|---|
| `POST /api/notify/v1` | `ping-api-key` | Validate, persist, and queue a notification |
| `POST /api/webhooks/twilio/sms-status` | Twilio signature | Reconcile provider SMS status |
| `GET /health` | Public | API process liveness |
| `GET /ready` | Public | PostgreSQL and Redis readiness |

Tenant routes under `/tenant`:

| Route | Authentication | Responsibility |
|---|---|---|
| `POST /signup` | Auth rate limit | Create tenant and return its raw API key once |
| `POST /login` | Auth rate limit | Set the HTTP-only tenant session cookie |
| `GET /session` | Tenant session | Return current tenant/session identity |
| `POST /rotate` | Tenant session + password + rate limit | Replace API key and return the new raw value once |
| `POST /logout` | Tenant session | Revoke the token and clear the cookie |

`GET /analytics` uses the tenant session. The dashboard cookie is for browser account operations; `ping-api-key` is for server-to-server notification requests. Do not expose the API key to ordinary browser application code.

## Payload and Tenant Isolation

`src/services/authenticatPayload.ts` is the canonical notification request schema. A request contains:

- `user.id`: the caller's external user ID, unique only within a tenant;
- optional `user.email` and `user.phone` contact values;
- `notification.type`, `notification.title`, and `notification.message`;
- one or more requested `channels`: currently `EMAIL` or `SMS` at the public boundary.

If `EMAIL` is requested, an email value is required. If `SMS` is requested, an E.164 phone number is required. The Prisma enum also contains `WEBSOCKET`, but its provider is not implemented and the public payload schema does not accept it. Do not advertise or enable it accidentally.

The `User` uniqueness boundary is `(tenantId, externalUserId)`. Maintain this boundary in every lookup/upsert; never resolve an external user globally.

## Queue, Retries, and State

`src/queue/notification.queue.ts` creates a deterministic job ID from the internal user and notification IDs. BullMQ retry defaults live in `src/queue/connection.ts`; verify them before changing retry documentation or tests.

Current parent notification states are:

```text
PENDING -> QUEUED -> PROCESSING -> SENT
                         |          
                         -> RETRYING -> PROCESSING
                         -> FAILED
```

Current delivery states are `PENDING`, `SENT`, `DELIVERED`, and `FAILED`.

Important invariants:

- Skip deliveries already in `SENT`, `DELIVERED`, or `FAILED` during worker retries.
- Skip an SMS delivery that already has a provider SID so a normal retry does not submit it again.
- Do not mark SMS delivered when Twilio merely accepts `messages.create()`.
- Email `SENT` means SMTP accepted the message; it does not prove inbox placement or reading.
- Provider submission is at-least-once. A process crash after external acceptance but before the provider ID is stored can still duplicate a submission.
- The sweeper currently searches old parent notifications in `PENDING`; it is not general reconciliation for lost Twilio callbacks or every stuck state.

When changing state logic, test mixed-channel results, worker retries, already-terminal deliveries, Twilio intermediate/final callbacks, and parent-status reconciliation.

## Provider and Webhook Rules

### Email

`src/providers/email.ts` owns Nodemailer configuration and submission. It reads `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, and `EMAIL_FROM`. Port 465 requires `SMTP_SECURE=true`; port 587 requires `false` for STARTTLS.

### SMS

`src/providers/sms.ts` owns Twilio submission. It reads `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `SMS_FROM`, and `TWILIO_STATUS_CALLBACK_URL`. Destination phone numbers must be E.164 at the request boundary.

`src/controller/twilioWebhook.ts` owns callback validation and status normalization. Preserve these rules:

- the callback must remain publicly reachable over HTTPS in a deployed environment;
- validate `X-Twilio-Signature` before mutating delivery state;
- preserve form-urlencoded request parsing;
- do not place tenant API-key or dashboard-session middleware on the provider callback;
- locate delivery records by stored provider message ID;
- treat intermediate provider statuses as non-terminal;
- make repeated terminal callbacks safe.

Keep provider calls mockable in tests. Never send real notifications from the test suite.

## Authentication and Security

- API keys are generated as random raw values, hashed with SHA-256, and stored only as hashes. Raw keys may be returned only during signup and successful rotation.
- Tenant passwords are hashed with bcrypt.
- Dashboard authentication uses a signed JWT in an HTTP-only, same-site cookie. Production cookies are secure.
- Logout revokes the current token in Redis for its remaining lifetime.
- API-key rotation must invalidate the previous key immediately.
- Notification rate limiting is tenant-based. Authentication limiting covers IP and normalized account identity.
- Redis failure currently fails open for notification rate limiting but fails closed for authentication attempts. Preserve or deliberately revisit this distinction with tests.
- Production origin checks depend on `DASHBOARD_ALLOWED_ORIGINS`, and proxy-derived client IP behavior depends on `TRUST_PROXY_HOPS`.
- Global middleware applies request IDs and security headers. Preserve `X-Request-ID` in diagnosable server-error paths.

Do not treat hidden dashboard controls as authorization. All session, tenant, password-confirmation, and key-rotation checks remain backend-owned.

## Data and Infrastructure

- PostgreSQL/Prisma is durable truth for tenants, external users, contact channels, notifications, deliveries, provider IDs, timestamps, and errors.
- Redis is required for BullMQ, rate limiting, and JWT revocation. It is not durable delivery truth.
- BullMQ transports jobs; the database owns business state.
- The API and worker each create/use shared infrastructure clients but own their own process shutdown.
- `GET /health` proves only that the API process is responding. `GET /ready` checks PostgreSQL and Redis, not worker/provider readiness.

Schema changes require a checked-in Prisma migration. Prefer additive or in-place enum migrations that preserve existing data. Do not edit generated Prisma output under `src/generated/prisma`; run `npx prisma generate` instead.

## Dashboard Boundaries

The dashboard is a separate React/Vite application under `dashboard/`. It uses tenant session cookies for signup/login/session/logout/rotation and analytics calls.

- Keep credentials enabled on dashboard requests that need the session cookie.
- Keep API base URL/origin handling consistent with backend origin checks.
- Never persist or reveal an old API key. Show a raw key only from the signup or rotation response and clearly tell the tenant to save it.
- Analytics presentation must use backend-scoped data; do not fetch or infer cross-tenant records in the browser.
- Reuse the existing layout and page structure before adding dependencies or another design system.

## Environment and Deployment Safety

`.env.example` is the public configuration contract. The API requires database, Redis, JWT, proxy/origin, and port configuration. The worker additionally requires complete SMTP and Twilio configuration at startup.

- `JWT_SECRET` must be at least 32 characters.
- `DASHBOARD_ALLOWED_ORIGINS` is mandatory in production.
- `TRUST_PROXY_HOPS` must match the actual reverse-proxy chain; an incorrect value can undermine IP-based rate limiting.
- `TWILIO_STATUS_CALLBACK_URL` must be the exact public callback URL used for signature validation.
- Do not copy backend secrets into dashboard/Vite environment variables.
- Apply Prisma migrations before starting new application code in a deployed environment.
- Run both `start:api` and `start:worker`; an API-only deployment accepts requests but does not process queued deliveries.
- Validate credentials, callback reachability, signature handling, sender permissions, and provider sandbox/trial restrictions before claiming production readiness.

## Tests and Verification

Vitest tests are colocated in `__tests__` directories under controllers, services, providers, and workers. Use existing mocking patterns for Prisma, Redis, queues, Nodemailer, and Twilio.

Canonical verification commands:

```bash
npm test
npm run typecheck
npx prisma validate
npx prisma generate
npm --prefix dashboard run lint
npm --prefix dashboard run build
git diff --check
```

Choose checks proportionate to the change. A TypeScript compile does not verify PostgreSQL migrations, Redis/BullMQ behavior, provider credentials, callback reachability, or real carrier delivery. Report those limits explicitly.

## Canonical References by Task

| Task | Inspect first |
|---|---|
| API startup, middleware, health | `src/index.ts` |
| Public notification contract | `src/services/authenticatPayload.ts`, `src/controller/notification.ts` |
| API-key authentication | `src/middleware/apiKey.middleware.ts`, `src/services/apiKey.ts` |
| Tenant sessions and key rotation | `src/routes/tenant.ts`, `src/controller/tenant.ts`, `src/services/auth.ts`, `src/middleware/auth.ts` |
| Rate limiting | `src/services/rateLimiter.ts` |
| Queue IDs and submission | `src/queue/notification.queue.ts`, `src/queue/connection.ts` |
| Worker delivery and retries | `src/worker/worker.ts`, `src/worker/notification.processor.ts` |
| Pending recovery | `src/worker/sweeper.ts` |
| Email delivery | `src/providers/email.ts` |
| SMS submission/status | `src/providers/sms.ts`, `src/controller/twilioWebhook.ts` |
| Persistent models and enums | `prisma/schema.prisma`, `prisma/migrations/` |
| Dashboard behavior | `dashboard/src/App.tsx`, `dashboard/src/pages/`, `dashboard/src/components/` |

Documentation explains intent, but current source and tests prove behavior. Update this guide when a change moves an ownership boundary or alters a canonical flow.
