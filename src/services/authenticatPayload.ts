import { z } from "zod";

export const payloadSchema = z.object({
    user: z.object({
        id: z.string(),
        email: z.string().optional(),
        phone: z.string().optional()
    }).refine((data) => data.email || data.phone, {
        message : "You must provide either an email or a phone number."
    }),

    notification: z.object({
        type: z.string(),
        title: z.string(),
        message: z.string()
    }),

    channels: z.array(z.string())
})

export type notificationPayload = z.infer<typeof payloadSchema>;