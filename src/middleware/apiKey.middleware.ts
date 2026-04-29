import crypto from "crypto";
import type { NextFunction, Request, Response } from "express";
import prisma from "../lib/prisma.js";
import { redis } from "../lib/redis.js"
import { getCachedKey } from "../services/cacheApiKey.js";

type cachedKey = {
    tenantId: string
}

export async function verifyKey(req: Request, res: Response, next: NextFunction) {
    
    const rawKey = req.headers["ping-api-key"];
    if (!rawKey || Array.isArray(rawKey)) return res.status(400).json({ message: "Invalid api key" });

    const hashedKey = crypto.createHash("sha256").update(rawKey).digest("hex");
    
    const cached = await getCachedKey<cachedKey>(hashedKey);
    if (!cached) {
        
        const Tenant = await prisma.tenant.findUnique({
            where: {
                apiKey : hashedKey
            }
        })

        if (!Tenant) {
            return res.status(404).json({ message: "Invalid Api Key" });
        }

        req.tenantId = Tenant.id;
        await redis.set(
            `apikey:${hashedKey}`,
            JSON.stringify({ tenantId: Tenant.id }),
            "EX",
            600
        )

       return next();
    }

    req.tenantId = cached.tenantId;
    
    return next();
    
}