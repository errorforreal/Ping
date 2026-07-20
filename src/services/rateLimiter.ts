import { redis } from "../lib/redis.js";
import type { Request, Response, NextFunction } from "express";
import crypto from "node:crypto";


const RATE_LIMIT = 100;
const WINDOW = 15 * 60;

export async function isRateLimited(req: Request, res: Response, next: NextFunction) {
    try {
        const tenantId = req.tenantId;
        if (!tenantId) return res.status(403).json({ message: "Tenant not found" });

        const key = `rate_limit:${tenantId}`;

        const current = await redis.incr(key);

        if (current == 1) {
            await redis.expire(key, WINDOW);
        }

        if (current > RATE_LIMIT) return res.status(429).json({ message: "Too many requests, try again later!" });

        next();
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.log("Rate limiter error: ", message);
        next();
    }
}

const AUTH_RATE_LIMIT = 10;
const AUTH_WINDOW = 15 * 60;

export async function isAuthRateLimited(req: Request, res: Response, next: NextFunction) {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : undefined;
    const account = req.tenant?.tenantId ?? (email && crypto.createHash("sha256").update(email).digest("hex"));
    const keys = [`auth_rate:ip:${req.ip}`, ...(account ? [`auth_rate:account:${account}`] : [])];

    try {
        const counts = await Promise.all(keys.map(async key => {
            const count = await redis.incr(key);
            if (count === 1) await redis.expire(key, AUTH_WINDOW);
            return count;
        }));
        if (counts.some(count => count > AUTH_RATE_LIMIT)) {
            res.setHeader("Retry-After", AUTH_WINDOW);
            return res.status(429).json({ message: "Too many authentication attempts" });
        }
        return next();
    } catch {
        return res.status(503).json({ message: "Authentication temporarily unavailable" });
    }
}
