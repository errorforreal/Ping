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
}).refine((data) => {
    if (data.channels.includes("EMAIL") && !data.user.email) return false;
    if (data.channels.includes("SMS") && !data.user.phone) return false;
    
    return true;
}, {
    message : "Mismatch between requested channels and provided user info."
})

export type notificationPayload = z.infer<typeof payloadSchema>;