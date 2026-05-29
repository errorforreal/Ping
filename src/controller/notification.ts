import type { Request, Response } from "express";
import prisma  from "../lib/prisma.js";
import type { notificationPayload } from "../services/authenticatPayload.js";
import { payloadSchema } from "../services/authenticatPayload.js";
import { ZodError } from "zod";
import { queueEvent } from "../queue/notification.queue.js";


export async function handleNotify(req: Request, res: Response) {
    const tenantid = req.tenantId;
    if (!tenantid) return res.status(403).json({ message: "Tenant not found! Check Api key" });

    const tenant = await prisma.tenant.findUnique({
        where: {
            id: tenantid
        },
        select : {id : true}
    });
    if (!tenant) return res.status(403).json({ message: "Tenant not found! Check Api key" });

    const payload: notificationPayload = req.body;


    let validPayload: notificationPayload;

    try {
        validPayload = payloadSchema.parse(payload);
    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({                   // 400 -> client sent bad input
                message: "Invalid notification payload",
                error : error.issues
            })
        }

        return res.status(500).json({ message: "Internal Server error" });
    }

    try {
        
        const user = await prisma.user.upsert({
            where: {
                tenantId_externalUserId: {
                    externalUserId: validPayload.user.id,
                    tenantId : tenant.id
                }
            },
            update: {},
            create: {
                externalUserId: validPayload.user.id,
                tenantId : tenant.id
            }
        })
    
        const notification = await prisma.notification.create({
            data: {
                tenantId: tenant.id,
                userId: user.id ,
                type: validPayload.notification.type,
                title: validPayload.notification.title,
                message: validPayload.notification.message,
            },
        });

      
        queueEvent({ userId : user.id, notificationId : notification.id, tenantId : tenant.id});
    
        return res.status(201).json({ id: notification.id });
        
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }

}