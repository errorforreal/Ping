import "dotenv/config";
import express from "express";
import type { NextFunction, Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { tenantRouter } from "./routes/tenant.js";
import { analyticsRouter } from "./routes/analytics.js";
import { handleNotify } from "./controller/notification.js";
import { verifyKey } from "./middleware/apiKey.middleware.js";
import { isRateLimited } from "./services/rateLimiter.js";
import { handleTwilioSmsStatus } from "./controller/twilioWebhook.js";
import prisma from "./lib/prisma.js";
import { redis } from "./lib/redis.js";
import { notificationQueue } from "./queue/connection.js";

for (const name of ["DATABASE_URL", "REDIS_URL", "JWT_SECRET", "JWT_EXPIRES_IN"]) {
    if (!process.env[name]) throw new Error(`${name} is required`);
}
if (process.env.JWT_SECRET!.length < 32) throw new Error("JWT_SECRET must be at least 32 characters");
if (process.env.NODE_ENV === "production" && !process.env.DASHBOARD_ALLOWED_ORIGINS) {
    throw new Error("DASHBOARD_ALLOWED_ORIGINS is required in production");
}
const trustProxyHops = Number(process.env.TRUST_PROXY_HOPS ?? 0);
if (!Number.isInteger(trustProxyHops) || trustProxyHops < 0) throw new Error("TRUST_PROXY_HOPS must be a non-negative integer");

const app = express();
app.set("trust proxy", trustProxyHops);

app.use((req, res, next) => {
    req.requestId = req.header("X-Request-ID") ?? randomUUID();
    res.set({
        "X-Request-ID": req.requestId,
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "Referrer-Policy": "no-referrer"
    });
    if (process.env.NODE_ENV === "production") res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    next();
});
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false, limit: "100kb" }));
app.use((req, res, next) => {
    const origin = req.header("Origin");
    const allowed = (process.env.DASHBOARD_ALLOWED_ORIGINS ?? "http://localhost:5173").split(",").map(value => value.trim());
    if (origin && !allowed.includes(origin)) return res.status(403).json({ message: "Origin not allowed" });
    next();
});

app.use("/tenant", tenantRouter);
app.use("/analytics", analyticsRouter);
app.post("/api/webhooks/twilio/sms-status", handleTwilioSmsStatus);
app.post("/api/notify/v1", verifyKey, isRateLimited, handleNotify);
app.get("/health", (_req, res) => res.status(200).json({ status: "ok" }));
app.get("/ready", async (_req, res) => {
    try {
        await Promise.all([prisma.$queryRaw`SELECT 1`, redis.ping()]);
        return res.status(200).json({ status: "ready" });
    } catch {
        return res.status(503).json({ status: "not ready" });
    }
});
app.use((error: unknown, req: Request, res: Response, _next: NextFunction) => {
    console.error(`[${req.requestId}]`, error instanceof Error ? error.message : "Unknown server error");
    return res.status(500).json({ message: "Internal server error", requestId: req.requestId });
});


const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log(`API listening on port ${PORT}`);
});

let shuttingDown = false;
async function shutdown() {
    if (shuttingDown) return;
    shuttingDown = true;
    await new Promise<void>(resolve => server.close(() => resolve()));
    await Promise.all([notificationQueue.close(), redis.quit(), prisma.$disconnect()]);
}

process.once("SIGTERM", () => void shutdown());
process.once("SIGINT", () => void shutdown());
