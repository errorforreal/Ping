import type { Request, Response, NextFunction } from "express";
import { SESSION_COOKIE, tokenRevocationKey, validateToken } from "../services/auth.js";
import type { authPayload } from "../services/auth.js";
import { redis } from "../lib/redis.js";

function readCookie(req: Request, name: string) {
    const value = req.headers.cookie?.split(";").map(cookie => cookie.trim()).find(cookie => cookie.startsWith(`${name}=`));
    try {
        return value ? decodeURIComponent(value.slice(name.length + 1)) : undefined;
    } catch {
        return undefined;
    }
}

export async function isLoggedIn(req: Request, res: Response, next: NextFunction) {
    const [scheme, bearer] = req.headers.authorization?.split(" ") ?? [];
    const token = scheme === "Bearer" ? bearer : readCookie(req, SESSION_COOKIE);
    if(!token) return res.status(401).json({ message: "Invalid token" });

    try {
        const isBlacklisted = await redis.get(tokenRevocationKey(token));
        if (isBlacklisted) {
            return res.status(401).json({ message: "Token revoked" });
        }

        const payload: authPayload = validateToken(token);
        req.tenant = payload;
        req.authToken = token;
        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid token" });
    }

}
