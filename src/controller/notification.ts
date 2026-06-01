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
        
        const user = await prisma.$transaction(
            async (tx) => {
                const u = await tx.user.upsert({
                    where: {
                        tenantId_externalUserId: {
                            tenantId: tenant.id,
                            externalUserId: validPayload.user.id
                        }
                    },
                    update: {},
                    create: {
                        tenantId: tenant.id,
                        externalUserId: validPayload.user.id
                    }
                });

                const { email, phone } = validPayload.user;

                if (email) {
                    await tx.userChannel.upsert({
                        where: {
                            userId_type: {
                                userId: u.id,
                                type: "EMAIL"
                            }
                        },
                        update: { value: email },
                        create: {
                            userId: u.id,
                            value: email,
                            type: "EMAIL"
                        }
                    });
                }
                if (phone) {
                    await tx.userChannel.upsert({
                        where: {
                            userId_type: {
                                userId: u.id,
                                type: "PHONE"
                            }
                        },
                        update: { value: phone },
                        create: {
                            userId: u.id,
                            value: phone,
                            type: "PHONE"
                        }
                    });
                }
                
                return u;
           }
       )
    
        const notification = await prisma.notification.create({
            data: {
                tenantId: tenant.id,
                userId: user.id ,
                type: validPayload.notification.type,
                title: validPayload.notification.title,
                message: validPayload.notification.message,
            },
        });

      
        await queueEvent({ userId : user.id, notificationId : notification.id, tenantId : tenant.id});
    
        return res.status(201).json({ id: notification.id });

    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }

}
