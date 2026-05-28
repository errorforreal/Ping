import type { Request, Response } from "express";
import prisma  from "../lib/prisma.js";
import type { notificationPayload } from "../services/authenticatPayload.js";
import { payloadSchema } from "../services/authenticatPayload.js";
import { ZodError } from "zod";


export async function handleNotify(req: Request, res: Response) {
    const tenantId = req.tenantId;
    if (!tenantId) return res.status(403).json({ message: "Tenant not found! Check Api key" });

    const tenant = await prisma.tenant.findUnique({
        where: {
            id: tenantId
        }
    });
    if (!tenant) return res.status(403).json({ message: "Tenant not found! Check Api key" });

    const payload: notificationPayload = req.body;


    try {
        const isValidPayload = payloadSchema.parse(payload);
    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({                   // 400 -> client sent bad input
                message: "Invalid notification payload",
                error : error.issues
            })
        }

        return res.status(500).json({ message: "Internal Server error" });
    }
    


    
}