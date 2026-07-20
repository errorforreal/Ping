import { beforeEach, describe, expect, it, vi } from "vitest";
import express from "express";
import request from "supertest";
import bcrypt from "bcrypt";
import prisma from "../../lib/prisma.js";
import { redis } from "../../lib/redis.js";
import { handleLogin, handleRegenerateKey } from "../tenant.js";
import { isLoggedIn } from "../../middleware/auth.js";
import { verifyKey } from "../../middleware/apiKey.middleware.js";
import { generateToken, SESSION_COOKIE } from "../../services/auth.js";
import { isAuthRateLimited } from "../../services/rateLimiter.js";

vi.mock("bcrypt", () => ({ default: { compare: vi.fn(), hash: vi.fn() } }));
vi.mock("../../lib/prisma.js", () => ({
    default: {
        tenant: { findUnique: vi.fn(), update: vi.fn() }
    }
}));
vi.mock("../../lib/redis.js", () => ({
    redis: { get: vi.fn(), set: vi.fn(), incr: vi.fn(), expire: vi.fn() }
}));

describe("Security hardening", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.JWT_SECRET = "a-secure-test-secret-that-is-long-enough";
        process.env.JWT_EXPIRES_IN = "1h";
    });

    it("rotates only the authenticated tenant key", async () => {
        vi.mocked(prisma.tenant.findUnique).mockResolvedValue({ id: "tenant_1", password: "hash" } as never);
        vi.mocked(prisma.tenant.update).mockResolvedValue({ id: "tenant_1" } as never);
        vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
        const app = express();
        app.use(express.json());
        app.post("/rotate", (req, _res, next) => {
            req.tenant = { tenantId: "tenant_1", role: "USER" };
            next();
        }, handleRegenerateKey);

        const response = await request(app).post("/rotate").send({ password: "current-password" });

        expect(response.status).toBe(200);
        expect(response.body.apiKey).toHaveLength(64);
        expect(prisma.tenant.findUnique).toHaveBeenCalledWith({ where: { id: "tenant_1" } });
        expect(prisma.tenant.update).toHaveBeenCalledWith({
            where: { id: "tenant_1" },
            data: { apiKey: expect.stringMatching(/^[a-f0-9]{64}$/) }
        });
    });

    it("creates an HTTP-only dashboard session cookie", async () => {
        vi.mocked(prisma.tenant.findUnique).mockResolvedValue({ id: "tenant_1", role: "USER", password: "hash" } as never);
        vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
        const app = express();
        app.use(express.json());
        app.post("/login", handleLogin);

        const response = await request(app).post("/login").send({ email: " ADMIN@EXAMPLE.COM ", password: "password" });

        expect(response.status).toBe(200);
        expect(prisma.tenant.findUnique).toHaveBeenCalledWith({ where: { email: "admin@example.com" } });
        expect(response.headers["set-cookie"]?.[0]).toContain(`${SESSION_COOKIE}=`);
        expect(response.headers["set-cookie"]?.[0]).toContain("HttpOnly");
        expect(response.headers["set-cookie"]?.[0]).toContain("SameSite=Lax");
    });

    it("checks PostgreSQL on every API-key request so rotation is immediate", async () => {
        vi.mocked(prisma.tenant.findUnique)
            .mockResolvedValueOnce({ id: "tenant_1" } as never)
            .mockResolvedValueOnce(null);
        const app = express();
        app.get("/protected", verifyKey, (_req, res) => res.sendStatus(204));

        expect((await request(app).get("/protected").set("ping-api-key", "old-key")).status).toBe(204);
        expect((await request(app).get("/protected").set("ping-api-key", "old-key")).status).toBe(401);
        expect(prisma.tenant.findUnique).toHaveBeenCalledTimes(2);
    });

    it("authenticates a secure cookie without browser storage", async () => {
        vi.mocked(redis.get).mockResolvedValue(null);
        const token = generateToken({ id: "tenant_1", role: "USER" });
        const app = express();
        app.get("/session", isLoggedIn, (req, res) => res.json(req.tenant));

        const response = await request(app).get("/session").set("Cookie", `${SESSION_COOKIE}=${token}`);

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ tenantId: "tenant_1", role: "USER" });
    });

    it("rate-limits authentication by IP and normalized account", async () => {
        vi.mocked(redis.incr).mockResolvedValue(11);
        const app = express();
        app.use(express.json());
        app.post("/login", isAuthRateLimited, (_req, res) => res.sendStatus(204));

        const response = await request(app).post("/login").send({ email: "ADMIN@example.com" });

        expect(response.status).toBe(429);
        expect(response.headers["retry-after"]).toBe("900");
        expect(redis.incr).toHaveBeenCalledTimes(2);
    });
});
