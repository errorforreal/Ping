# Ping

Ping is a multi-tenant notification service for sending user notifications through email and SMS using a single API. Tenants sign up, receive an API key once, and use that key to enqueue notifications through the public notification endpoint.

The service is built around asynchronous delivery: API requests create notification records, enqueue BullMQ jobs, and workers process each delivery through provider-specific handlers.

## Current Status

Ping is under active development. The backend notification flow is implemented and covered by focused unit tests. A minimal tenant dashboard is planned for API key onboarding, analytics, documentation, and delivery visibility.

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
- Resend
- Twilio
- Vitest

## Architecture

```text
Tenant app / backend
        |
        | POST /tenant/api/notify/v1
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

Logs in a tenant and returns a JWT.

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
{
  "message": "jwt-token"
}
```

### Send Notification

Queues a notification for async delivery.

```http
POST /tenant/api/notify/v1
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

The worker processes jobs from the `notifications` queue.

```bash
npx tsx ./src/worker/worker.ts
```

The worker also registers a recurring sweeper job that checks for old `PENDING` notifications and attempts to enqueue them again.

## Local Development

Install dependencies:

```bash
npm install
```

Run the API:

```bash
npm run dev
```

Run tests:

```bash
npm test
```

Typecheck:

```bash
npx tsc --noEmit
```

## Environment Variables

Create a `.env` file with:

```env
DATABASE_URL=
REDIS_URL=
JWT_SECRET=
JWT_EXPIRES_IN=
RESEND_API_KEY=
EMAIL_FROM=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
SMS_FROM=
PORT=3000
```

## Planned Dashboard

The planned dashboard should be tenant-authenticated with JWT login, not API-key authenticated. The API key is for server-to-server notification sending.

Planned sections:

- Onboarding: show the API key once after signup
- Analytics: total notifications, sent, failed, retrying, channel split, recent delivery failures
- API documentation: endpoint, headers, payload examples, response examples
- Notification logs: per-notification and per-delivery status
- API key management: rotate key, reveal key only at creation/rotation time
- Settings: provider configuration and tenant profile

The dashboard will require additional backend endpoints for analytics, logs, and API key rotation.

## Roadmap

- Add bounded sweeper retry tracking with `queueAttempts` and `lastQueueAttemptAt`
- Add delivery/log read APIs for dashboard analytics
- Add API key rotation
- Add Docker Compose for Postgres and Redis
- Add `.env.example`
- Add centralized error handling and request logging
- Add production security middleware
- Add integration tests around queue and database behavior

## License

ISC
