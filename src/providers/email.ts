import  { ChannelType } from "../generated/prisma/enums.js";
import nodemailer from "nodemailer";
import prisma from "../lib/prisma.js";
import { generateEmailTemplate } from "../utils/emailTemplate.js";
import type { deliveryHandler } from "./index.js";

let transporter: ReturnType<typeof nodemailer.createTransport> | undefined;

export const sendEmail: deliveryHandler = async (_delivery, notification, userId) => {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT);
    const secureText = process.env.SMTP_SECURE;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.EMAIL_FROM;

    if (!host || !Number.isInteger(port) || port < 1 || port > 65535 || !secureText || !user || !pass || !from) {
        return { success: false, error: "Missing or invalid SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, or EMAIL_FROM" };
    }
    if (!['true', 'false'].includes(secureText) || (port === 465 && secureText !== 'true') || (port === 587 && secureText !== 'false')) {
        return { success: false, error: "SMTP_SECURE must be true for port 465 and false for port 587" };
    }

    let channelValue: {value : string} | null;
    try {
        channelValue = await prisma.userChannel.findUnique({
            where: {
                userId_type: {
                    userId: userId,
                    type: ChannelType.EMAIL
                }
            },
            select: {
                value: true
            }
        });
        if (!channelValue) return { success: false, error: "User has no EMAIL channel configured" };

    } catch (error) {
        return { success: false, error: `Error fetching user channel: ${error}` };
    }

    try {
        transporter ??= nodemailer.createTransport({ host, port, secure: secureText === 'true', auth: { user, pass } });
        const info = await transporter.sendMail({
            from,
            to: channelValue.value,
            subject: notification.title ?? "Do not reply",
            html: generateEmailTemplate(notification.title, notification.message)
        });
        if (info.rejected.length) {
            return { success: false, error: `SMTP rejected recipient: ${info.rejected.join(", ")}` };
        }
        return { success: true, providerMessageId: info.messageId };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
}
