import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import { z } from "zod";
import crypto from "node:crypto";

export const SESSION_COOKIE = "ping_session";

const email = z.string().trim().email().max(254).transform(value => value.toLowerCase());

export const loginSchema = z.object({
    email,
    password: z.string().min(1).max(128)
}).strict();

export const signupSchema = loginSchema.extend({
    name: z.string().trim().min(1).max(100),
    password: z.string().min(12).max(128)
}).strict();

export const rotateKeySchema = z.object({ password: z.string().min(1).max(128) }).strict();

export type authTenant = {
    id: string,
    role: string
}
export type authPayload = {
    tenantId: string,
    role: string
}

export function generateToken(tenant: authTenant):string {
    const secret = process.env.JWT_SECRET;
    const expiresIn = process.env.JWT_EXPIRES_IN as SignOptions["expiresIn"] | undefined;
    if (!secret || !expiresIn) throw new Error("JWT_SECRET and JWT_EXPIRES_IN are required");

    const payload: authPayload = {
        tenantId: tenant.id,
        role : tenant.role
    }

    return jwt.sign(payload, secret, { expiresIn });
}

export function validateToken(token: string): authPayload {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET is required");
    const payload = jwt.verify(token, secret);
    if (typeof payload === "string" || typeof payload.tenantId !== "string" || typeof payload.role !== "string") {
        throw new Error("Invalid token payload");
    }
    return { tenantId: payload.tenantId, role: payload.role };
}

export function tokenTtlSeconds(token: string) {
    const payload = jwt.decode(token);
    return typeof payload === "object" && payload?.exp
        ? Math.max(0, payload.exp - Math.floor(Date.now() / 1000))
        : 0;
}

export const tokenRevocationKey = (token: string) => `bl_${crypto.createHash("sha256").update(token).digest("hex")}`;
