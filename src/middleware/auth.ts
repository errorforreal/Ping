import type { Request, Response, NextFunction } from "express";
import { validateToken } from "../services/auth.js";
import type { authPayload } from "../services/auth.js";
import { redis } from "../lib/redis.js";

export async function isLoggedIn(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "Invalid token" });

    const token = authHeader.split('Bearer ')[1];
    if(!token) return res.status(401).json({ message: "Invalid token" });

    try {
        const isBlacklisted = await redis.get(`bl_${token}`);
        if (isBlacklisted) {
            return res.status(401).json({ message: "Token revoked" });
        }

        const payload: authPayload = validateToken(token);
        req.tenant = payload;
        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid token" });
    }

}