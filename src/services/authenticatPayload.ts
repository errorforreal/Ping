import { z } from "zod";

const e164Phone = z.string().trim().regex(/^\+[1-9]\d{7,14}$/, "Phone number must be valid E.164");

export const payloadSchema = z.object({
    user: z.object({
        id: z.string(),
        email: z.string().optional(),
        phone: e164Phone.optional()
    }).refine((data) => data.email || data.phone, {
        message : "You must provide either an email or a phone number."
    }),

    notification: z.object({
        type: z.string(),
        title: z.string(),
        message: z.string()
    }),

    channels: z.array(z.enum(["EMAIL", "SMS"])).min(1, "You must provide at least one channel")
}).refine((data) => {
    if (data.channels.includes("EMAIL") && !data.user.email) return false;
    if (data.channels.includes("SMS") && !data.user.phone) return false;
    
    return true;
}, {
    message : "Mismatch between requested channels and provided user info."
})

export type notificationPayload = z.infer<typeof payloadSchema>;
