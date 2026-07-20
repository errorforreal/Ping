import type { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import bcrypt from "bcrypt";
import {
    generateToken,
    loginSchema,
    rotateKeySchema,
    SESSION_COOKIE,
    signupSchema,
    tokenRevocationKey,
    tokenTtlSeconds
} from "../services/auth.js";
import { generateApiKey } from "../services/apiKey.js";
import { redis } from "../lib/redis.js";

const cookieOptions = (maxAge?: number) => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    ...(maxAge ? { maxAge } : {})
});

export async function handleLogin(req: Request, res: Response) {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid email or password" });
    const { email, password } = parsed.data;

    try {
        const tenant = await prisma.tenant.findUnique({ where: { email } });

        if (!tenant) return res.status(401).json({ message: "Invalid email or password" });

        const isValidPass = await bcrypt.compare(password, tenant.password);

        if (!isValidPass) return res.status(401).json({ message: "Invalid email or password" });

        const token = generateToken({ id: tenant.id, role: tenant.role });
        res.cookie(SESSION_COOKIE, token, cookieOptions(tokenTtlSeconds(token) * 1000));
        return res.status(200).json({ message: "Login successful" });
    }
    catch (err) {
        return res.status(500).json({ message: "Internal server error" });
    }
}



export async function handleSignup(req: Request, res: Response) {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid signup details", error: parsed.error.issues });
    const { name, email, password } = parsed.data;

    try {
        const { rawKey, hashKey } = generateApiKey();
        const passwordHash = await bcrypt.hash(password, 10);
        await prisma.tenant.create({
            data: {
                name: name,
                email: email,
                password: passwordHash,
                apiKey: hashKey
            }
        });
        return res.status(201).json({
            message: "Tenant created successfully",
            apiKey: rawKey
        });
    }
    catch (err) {
        return res.status(500).json({ message: "Internal server error" });
    }
}

export async function handleRegenerateKey(req: Request, res: Response) {
    const parsed = rotateKeySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Password is required" });
    const tenantId = req.tenant?.tenantId;
    if (!tenantId) return res.status(401).json({ message: "Invalid token" });

    try {
        const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
        if (!tenant) return res.status(401).json({ message: "Invalid email or password" });

        const isValidPass = await bcrypt.compare(parsed.data.password, tenant.password);
        if (!isValidPass) return res.status(401).json({ message: "Invalid email or password" });

        const { rawKey, hashKey } = generateApiKey();
        await prisma.tenant.update({
            where: { id: tenant.id },
            data: { apiKey: hashKey }
        });

        console.log("[API Key] successfully changed for tenant : ", tenant.id);
        
        return res.status(200).json({ message: "Key regenerated", apiKey: rawKey, rotatedAt: new Date().toISOString() });
    } catch (err) {
        return res.status(500).json({ message: "Internal server error" });
    }
}

export async function handleTenantLogout(req: Request, res: Response) {
    try {
        const token = req.authToken;
        if (token) {
            const ttl = tokenTtlSeconds(token);
            if (ttl > 0) await redis.set(tokenRevocationKey(token), "revoked", "EX", ttl);
        }
        res.clearCookie(SESSION_COOKIE, cookieOptions());
        return res.status(200).json({ message: "Logged out successfully" });

    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }

    
}

export function handleTenantSession(req: Request, res: Response) {
    return res.status(200).json({ tenantId: req.tenant?.tenantId, role: req.tenant?.role });
}
