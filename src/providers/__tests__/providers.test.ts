import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChannelType, DeliveryStatus, NotificationStatus } from "../../generated/prisma/enums.js";
import prisma from "../../lib/prisma.js";

const mocks = vi.hoisted(() => {
    const sendMail = vi.fn();
    const createMessage = vi.fn();
    return {
        sendMail,
        createMessage,
        createTransport: vi.fn(() => ({ sendMail })),
        twilioClient: vi.fn(() => ({ messages: { create: createMessage } }))
    };
});

vi.mock("../../lib/prisma.js", () => ({
    default: { userChannel: { findUnique: vi.fn() } }
}));
vi.mock("nodemailer", () => ({ default: { createTransport: mocks.createTransport } }));
vi.mock("twilio", () => ({ default: mocks.twilioClient }));

import { sendEmail } from "../email.js";
import { sendSms } from "../sms.js";

const delivery = {
    id: "delivery_1",
    notificationId: "notif_1",
    channel: ChannelType.EMAIL,
    status: DeliveryStatus.PENDING,
    providerMessageId: null,
    error: null,
    sentAt: null,
    createdAt: new Date()
};
const notification = {
    id: "notif_1",
    tenantId: "tenant_1",
    userId: "user_1",
    type: "ALERT",
    title: "Test",
    message: "Hello",
    idempotencyKey: null,
    bullJobId: null,
    status: NotificationStatus.PENDING,
    createdAt: new Date()
};

describe("Providers", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        Object.assign(process.env, {
            EMAIL_FROM: "from@example.com",
            SMTP_HOST: "smtp.example.com",
            SMTP_PORT: "587",
            SMTP_SECURE: "false",
            SMTP_USER: "smtp-user",
            SMTP_PASS: "smtp-pass",
            TWILIO_ACCOUNT_SID: "AC123",
            TWILIO_AUTH_TOKEN: "token",
            SMS_FROM: "+14155550100",
            TWILIO_STATUS_CALLBACK_URL: "https://example.com/api/webhooks/twilio/sms-status"
        });
        vi.mocked(prisma.userChannel.findUnique).mockResolvedValue({ value: "user@example.com" } as never);
    });

    describe("Email", () => {
        it("validates SMTP configuration and secure port semantics", async () => {
            delete process.env.SMTP_HOST;
            expect(await sendEmail(delivery, notification, "user_1")).toMatchObject({ success: false });

            process.env.SMTP_HOST = "smtp.example.com";
            process.env.SMTP_PORT = "465";
            process.env.SMTP_SECURE = "false";
            expect(await sendEmail(delivery, notification, "user_1")).toMatchObject({
                success: false,
                error: expect.stringContaining("SMTP_SECURE")
            });
            expect(mocks.sendMail).not.toHaveBeenCalled();
        });

        it("preserves the template and returns the SMTP message id", async () => {
            mocks.sendMail.mockResolvedValue({ messageId: "smtp-123", rejected: [] });

            const result = await sendEmail(delivery, notification, "user_1");

            expect(result).toEqual({ success: true, providerMessageId: "smtp-123" });
            expect(mocks.sendMail).toHaveBeenCalledWith(expect.objectContaining({
                from: "from@example.com",
                to: "user@example.com",
                subject: "Test",
                html: expect.stringContaining("Hello")
            }));
        });

        it("keeps SMTP rejection and transport errors retryable", async () => {
            mocks.sendMail.mockResolvedValueOnce({ messageId: "smtp-123", rejected: ["user@example.com"] });
            expect(await sendEmail(delivery, notification, "user_1")).toMatchObject({ success: false, error: expect.stringContaining("rejected") });

            mocks.sendMail.mockRejectedValueOnce(new Error("connection reset"));
            expect(await sendEmail(delivery, notification, "user_1")).toEqual({ success: false, error: "connection reset" });
        });

        it("rejects a missing email channel", async () => {
            vi.mocked(prisma.userChannel.findUnique).mockResolvedValueOnce(null);
            expect(await sendEmail(delivery, notification, "user_1")).toMatchObject({ success: false, error: expect.stringContaining("no EMAIL") });
        });
    });

    describe("SMS", () => {
        const smsDelivery = { ...delivery, channel: ChannelType.SMS };

        it("validates all Twilio configuration", async () => {
            delete process.env.TWILIO_STATUS_CALLBACK_URL;
            expect(await sendSms(smsDelivery, notification, "user_1")).toMatchObject({
                success: false,
                error: expect.stringContaining("TWILIO_STATUS_CALLBACK_URL")
            });
            expect(mocks.createMessage).not.toHaveBeenCalled();
        });

        it("submits with SMS_FROM and persists the returned SID", async () => {
            vi.mocked(prisma.userChannel.findUnique).mockResolvedValueOnce({ value: "+14155550199" } as never);
            mocks.createMessage.mockResolvedValue({ sid: "SM123", status: "queued", errorMessage: null });

            const result = await sendSms(smsDelivery, notification, "user_1");

            expect(result).toEqual({ success: true, providerMessageId: "SM123" });
            expect(mocks.createMessage).toHaveBeenCalledWith(expect.objectContaining({
                from: "+14155550100",
                to: "+14155550199",
                statusCallback: "https://example.com/api/webhooks/twilio/sms-status"
            }));
        });

        it("returns Twilio rejection and thrown errors for BullMQ retry", async () => {
            mocks.createMessage.mockResolvedValueOnce({ sid: "SM123", status: "failed", errorMessage: "rejected" });
            expect(await sendSms(smsDelivery, notification, "user_1")).toEqual({ success: false, error: "rejected" });

            mocks.createMessage.mockRejectedValueOnce(new Error("Twilio unavailable"));
            expect(await sendSms(smsDelivery, notification, "user_1")).toEqual({ success: false, error: "Twilio unavailable" });
        });

        it("rejects a missing SMS channel", async () => {
            vi.mocked(prisma.userChannel.findUnique).mockResolvedValueOnce(null);
            expect(await sendSms(smsDelivery, notification, "user_1")).toMatchObject({ success: false, error: expect.stringContaining("no SMS") });
        });
    });
});
