# Ping

Ping is a multi-tenant notification service for sending user notifications through email and SMS using a single API. Tenants sign up, receive an API key once, and use that key to enqueue notifications through the public notification endpoint.

The service is built around asynchronous delivery: API requests create notification records, enqueue BullMQ jobs, and workers process each delivery through provider-specific handlers.

## Current Status

Ping is under active development. The backend notification flow and tenant dashboard are implemented and covered by focused tests.

## Features

- Tenant signup and login
- One-time raw API key return during signup
- Hashed API key storage
- API-key authentication for notification requests
- Per-tenant Redis rate limiting
- Notification payload validation with Zod
- Email and SMS delivery channels
- BullMQ queue-based background processing
- Retry-aware worker flow
- Sweeper job for old pending notifications
- Delivery status tracking with provider message IDs, sent timestamps, and failure errors
- Prisma/Postgres data model
- Vitest test coverage for payload validation, controller behavior, providers, worker logic, and sweeper logic

## Tech Stack

- Node.js
- TypeScript
- Express
- Prisma
- PostgreSQL
- Redis
- BullMQ
- Zod
- Nodemailer
- Twilio
- Vitest

## Architecture

```text
Tenant app / backend
        |
        | POST /api/notify/v1
        | Header: ping-api-key
        v
Express API
        |
        | validate API key, rate limit, validate payload
        v
Postgres
        |
        | create user, channels, notification, deliveries
        v
BullMQ / Redis
        |
        v
Worker
        |
        | dispatch by channel
        v
Email provider / SMS provider
```

## API

Base URL:

```text
http://localhost:3000
```

### Signup

Creates a tenant and returns the raw API key once.

```http
POST /tenant/signup
Content-Type: application/json
```

```json
{
  "name": "Acme",
  "email": "admin@acme.com",
  "password": "strong-password"
}
```

Response:

```json
{
  "message": "Tenant created successfully",
  "apiKey": "raw-api-key-shown-once"
}
```

Store this key securely. Ping stores only the hashed API key.

### Login

Logs in a tenant and creates a secure HTTP-only session cookie.

```http
POST /tenant/login
Content-Type: application/json
```

```json
{
  "email": "admin@acme.com",
  "password": "strong-password"
}
```

Response:

```json
{ "message": "Login successful" }
```

### Send Notification

Queues a notification for async delivery.

```http
POST /api/notify/v1
Content-Type: application/json
ping-api-key: YOUR_API_KEY
```

```json
{
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "phone": "+919999999999"
  },
  "notification": {
    "type": "ORDER_SHIPPED",
    "title": "Order Update",
    "message": "Your order has been shipped"
  },
  "channels": ["EMAIL", "SMS"]
}
```

Response:

```json
{
  "jobId": "ping-notification-user_123-notification_id"
}
```

Supported channels:

- `EMAIL`
- `SMS`

If `EMAIL` is requested, `user.email` is required. If `SMS` is requested, `user.phone` is required.

## Worker

The API and worker are separate processes. The worker processes jobs from the `notifications` queue and owns recurring sweeper registration.

```bash
npm run dev:api
npm run dev:worker
```

The worker also registers a recurring sweeper job that checks for old `PENDING` notifications and attempts to enqueue them again.

## Local Development

Install dependencies:

```bash
npm install
```

Run the API and worker in separate terminals:

```bash
npm run dev:api
npm run dev:worker
```

Run tests:

```bash
npm test
```

Typecheck:

```bash
npm run typecheck
```

## Environment Variables

Copy `.env.example` to `.env`, then configure:

```env
DATABASE_URL=
REDIS_URL=
TRUST_PROXY_HOPS=0
JWT_SECRET=
JWT_EXPIRES_IN=
DASHBOARD_ALLOWED_ORIGINS=http://localhost:5173
EMAIL_FROM=
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
SMS_FROM=
TWILIO_STATUS_CALLBACK_URL=https://your-domain.example/api/webhooks/twilio/sms-status
PORT=3000
```

Use `SMTP_SECURE=true` with port 465 and `false` with port 587 (STARTTLS). Twilio SMS requests remain `PENDING` after acceptance and become successful only after a signed `delivered` callback. Delivery is at-least-once: a worker crash after provider acceptance but before the SID is saved can cause a duplicate submission.

## Dashboard

The dashboard uses a secure HTTP-only session cookie. The API key is reserved for server-to-server notification sending.

Current sections:

- Signup: show the API key once after tenant creation
- Analytics: totals, success rate, failures, and recent deliveries
- API documentation: endpoint, headers, payload examples, response examples
- API key management: rotate key, reveal key only at creation/rotation time

## Roadmap

- Add bounded sweeper retry tracking with `queueAttempts` and `lastQueueAttemptAt`
- Add detailed notification-log APIs
- Add Docker Compose for Postgres and Redis
- Add integration tests around queue and database behavior

## License

ISC
