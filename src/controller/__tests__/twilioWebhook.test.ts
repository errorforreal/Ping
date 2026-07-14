import { beforeEach, describe, expect, it, vi } from "vitest";
import express from "express";
import request from "supertest";
import twilio from "twilio";
import prisma from "../../lib/prisma.js";
import { DeliveryStatus, NotificationStatus } from "../../generated/prisma/enums.js";
import { handleTwilioSmsStatus } from "../twilioWebhook.js";

vi.mock("twilio", () => ({ default: { validateRequest: vi.fn() } }));
vi.mock("../../lib/prisma.js", () => ({
    default: {
        notificationDelivery: { findFirst: vi.fn(), findMany: vi.fn(), updateMany: vi.fn() },
        notification: { update: vi.fn() }
    }
}));

const app = express();
app.use(express.urlencoded({ extended: false }));
app.post("/api/webhooks/twilio/sms-status", handleTwilioSmsStatus);

const delivery = {
    id: "delivery_1",
    notificationId: "notif_1",
    providerMessageId: "SM123",
    status: DeliveryStatus.PENDING
};

function callback(body: Record<string, string>, signature = "valid-signature") {
    return request(app)
        .post("/api/webhooks/twilio/sms-status")
        .set("X-Twilio-Signature", signature)
        .type("form")
        .send(body);
}

describe("Twilio SMS status webhook", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.TWILIO_AUTH_TOKEN = "token";
        process.env.TWILIO_STATUS_CALLBACK_URL = "https://example.com/api/webhooks/twilio/sms-status";
        vi.mocked(twilio.validateRequest).mockReturnValue(true);
        vi.mocked(prisma.notificationDelivery.findFirst).mockResolvedValue(delivery as never);
        vi.mocked(prisma.notificationDelivery.findMany).mockResolvedValue([{ status: DeliveryStatus.PENDING }] as never);
    });

    it("rejects an invalid signature before reading delivery data", async () => {
        vi.mocked(twilio.validateRequest).mockReturnValueOnce(false);

        const response = await callback({ MessageSid: "SM123", MessageStatus: "delivered" }, "invalid");

        expect(response.status).toBe(403);
        expect(prisma.notificationDelivery.findFirst).not.toHaveBeenCalled();
    });

    it("passes the configured callback URL and form fields to Twilio validation", async () => {
        await callback({ MessageSid: "SM123", MessageStatus: "queued" });

        expect(twilio.validateRequest).toHaveBeenCalledWith(
            "token",
            "valid-signature",
            "https://example.com/api/webhooks/twilio/sms-status",
            expect.objectContaining({ MessageSid: "SM123", MessageStatus: "queued" })
        );
    });

    it("returns 404 for an unknown SID so Twilio can retry a possible persistence race", async () => {
        vi.mocked(prisma.notificationDelivery.findFirst).mockResolvedValueOnce(null);
        expect((await callback({ MessageSid: "missing", MessageStatus: "delivered" })).status).toBe(404);
    });

    it("marks delivered and finalizes a fully successful notification", async () => {
        vi.mocked(prisma.notificationDelivery.findMany).mockResolvedValueOnce([
            { status: DeliveryStatus.SENT },
            { status: DeliveryStatus.DELIVERED }
        ] as never);

        const response = await callback({ MessageSid: "SM123", MessageStatus: "delivered" });

        expect(response.status).toBe(204);
        expect(prisma.notificationDelivery.updateMany).toHaveBeenCalledWith(expect.objectContaining({
            where: { id: "delivery_1", status: DeliveryStatus.PENDING },
            data: expect.objectContaining({ status: DeliveryStatus.DELIVERED, error: null })
        }));
        expect(prisma.notification.update).toHaveBeenCalledWith({
            where: { id: "notif_1" },
            data: { status: NotificationStatus.SENT }
        });
    });

    it.each(["failed", "undelivered"])("maps %s to FAILED", async (status) => {
        vi.mocked(prisma.notificationDelivery.findMany).mockResolvedValueOnce([{ status: DeliveryStatus.FAILED }] as never);

        await callback({ MessageSid: "SM123", MessageStatus: status, ErrorCode: "30003" });

        expect(prisma.notificationDelivery.updateMany).toHaveBeenCalledWith({
            where: { id: "delivery_1", status: DeliveryStatus.PENDING },
            data: { status: DeliveryStatus.FAILED, error: "30003" }
        });
        expect(prisma.notification.update).toHaveBeenCalledWith(expect.objectContaining({
            data: { status: NotificationStatus.FAILED }
        }));
    });

    it("keeps intermediate callbacks non-terminal", async () => {
        await callback({ MessageSid: "SM123", MessageStatus: "sent" });

        expect(prisma.notificationDelivery.updateMany).not.toHaveBeenCalled();
        expect(prisma.notification.update).toHaveBeenCalledWith(expect.objectContaining({
            data: { status: NotificationStatus.PROCESSING }
        }));
    });

    it.each([DeliveryStatus.DELIVERED, DeliveryStatus.FAILED])("constrains terminal status %s updates to PENDING rows", async (status) => {
        vi.mocked(prisma.notificationDelivery.findFirst).mockResolvedValueOnce({ ...delivery, status } as never);
        vi.mocked(prisma.notificationDelivery.findMany).mockResolvedValueOnce([{ status }] as never);

        await callback({ MessageSid: "SM123", MessageStatus: "delivered" });

        expect(prisma.notificationDelivery.updateMany).toHaveBeenCalledWith(expect.objectContaining({
            where: { id: "delivery_1", status: DeliveryStatus.PENDING }
        }));
    });
});
