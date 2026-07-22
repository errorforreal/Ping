# Ping

> Send transactional email and SMS through one API.

![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-ESM-339933?logo=node.js&logoColor=white)
![Status](https://img.shields.io/badge/status-active_development-F59E0B)

Ping is a self-hosted, multi-tenant notification service. Applications send one request to Ping, and Ping validates, stores, queues, and delivers the notification through email, SMS, or both.

## What is Ping?

Ping moves notification delivery out of your application's request cycle. Each tenant receives an API key for server-to-server requests, while PostgreSQL stores notification state and BullMQ workers deliver messages asynchronously through SMTP and Twilio.

Ping also includes a tenant dashboard for account access, API-key rotation, delivery analytics, and integration examples.

## Key Features

- One API for transactional email and SMS
- Asynchronous delivery with BullMQ and Redis
- Multi-tenant API-key authentication and rate limiting
- Per-channel delivery records, provider IDs, timestamps, and errors
- Retry-aware workers and recovery of old pending notifications
- Hashed API-key storage with one-time key display and secure rotation
- Tenant dashboard with analytics and recent delivery activity
- Signed Twilio status callbacks for carrier-confirmed SMS delivery

## How Ping Works

1. Your backend sends a notification using its `ping-api-key`.
2. Ping validates the tenant, rate limit, recipients, message, and channels.
3. Ping stores the notification and queues a BullMQ job.
4. A worker sends each delivery through SMTP or Twilio.
5. Email is marked sent after SMTP acceptance; SMS remains pending until Twilio reports its final status.

## Quick Start

### Requirements

- Node.js and npm
- PostgreSQL
- Redis
- SMTP credentials
- A Twilio account with an SMS-capable sender

### Setup

```bash
git clone https://github.com/errorforreal/Ping.git
cd Ping
npm install
npm --prefix dashboard install
cp .env.example .env
```

Fill in `.env`, then apply the Prisma migrations:

```bash
npx prisma migrate dev
```

Run the API, worker, and dashboard in separate terminals:

```bash
npm run dev:api
npm run dev:worker
npm --prefix dashboard run dev
```

The API runs at `http://localhost:3000` and the dashboard at `http://localhost:5173`. Check `GET /health` for the API process and `GET /ready` for PostgreSQL and Redis readiness.

## Send Your First Ping

Create a tenant and save the API key returned once:

```bash
curl -X POST http://localhost:3000/tenant/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Acme","email":"admin@acme.com","password":"strong-password"}'
```

Send a notification:

```bash
curl -X POST http://localhost:3000/api/notify/v1 \
  -H "Content-Type: application/json" \
  -H "ping-api-key: YOUR_API_KEY" \
  -d '{
    "user":{"id":"user_123","email":"user@example.com","phone":"+919999999999"},
    "notification":{"type":"ORDER_SHIPPED","title":"Order update","message":"Your order has shipped."},
    "channels":["EMAIL","SMS"]
  }'
```

Ping returns `201 Created` with a `jobId`. Use `EMAIL`, `SMS`, or both; the matching email or E.164 phone number is required.

```json
{"jobId":"ping-notification-user_123-notification_id"}
```

## Errors and Rate Limits

| Status | Meaning |
|---|---|
| `400` | Missing API key or invalid notification payload |
| `401` | API key is not recognized |
| `403` | No tenant is available for the authenticated request |
| `429` | Request limit exceeded |
| `500` | Notification storage or queueing failed |

Notification requests are limited to 100 requests per tenant every 15 minutes. Signup and login are limited to 10 attempts per IP or account every 15 minutes. Validation errors include field-level details; unexpected API errors include an `X-Request-ID` response header for tracing.

## Architecture

```text
Application backend
        |
        | POST /api/notify/v1 + ping-api-key
        v
Express API -----> PostgreSQL
        |          notifications, deliveries, tenants, users
        |
        v
BullMQ / Redis
        |
        v
Notification worker
        |--------------------|
        v                    v
SMTP / Nodemailer       Twilio SMS
                             |
                             v
                 Signed delivery callback
```

The API and worker are separate processes. The API owns authentication, validation, persistence, and queue submission. The worker owns provider calls, retries, delivery-state updates, and the recurring sweeper that requeues old `PENDING` notifications.
