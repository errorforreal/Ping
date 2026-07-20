import { beforeEach, describe, expect, it, vi } from "vitest";
import express from "express";
import request from "supertest";
import prisma from "../../lib/prisma.js";
import { getAnalytics } from "../analytics.js";

vi.mock("../../lib/prisma.js", () => ({
    default: {
        notification: { count: vi.fn() },
        notificationDelivery: { findMany: vi.fn() }
    }
}));

describe("Analytics", () => {
    beforeEach(() => vi.clearAllMocks());

    it("queries with the authenticated tenantId", async () => {
        vi.mocked(prisma.notification.count).mockResolvedValue(0);
        vi.mocked(prisma.notificationDelivery.findMany).mockResolvedValue([]);
        const app = express();
        app.get("/analytics", (req, _res, next) => {
            req.tenant = { tenantId: "tenant_1", role: "USER" };
            next();
        }, getAnalytics);

        expect((await request(app).get("/analytics")).status).toBe(200);
        expect(prisma.notification.count).toHaveBeenCalledWith({ where: { tenantId: "tenant_1" } });
    });
});
