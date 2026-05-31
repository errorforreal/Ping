import { redis } from "../lib/redis.js";
import type { Request, Response, NextFunction } from "express";


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