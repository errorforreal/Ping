import type { Job } from "bullmq";
import prisma from "../lib/prisma.js";
import { ChannelProvider } from "../providers/index.js";
import { DeliveryStatus, NotificationStatus } from "../generated/prisma/enums.js";
import { runSweeperLogic } from "./sweeper.js";

/*
what should this function do???

when a notification req comes -> we push it into the queue -> we push the notification id and user id -> 
now the worker fetches deliveries using notification id, now suppose there are 2 deliveries, email and phone, if email 
succeeds and worker crashes or phone fails, job is marked as failed, when worker again fetches the deliveries, it should 
handle this edge case of not sending the email notification again

*/


export async function processNotificationJob(job: Job) {

    if (job.name === "sweeper-job") {
        const { success, error } = await runSweeperLogic();
        if (!success) {
            console.error(`[Notification Sweeper] Failed to run : ${error} `);
        }
        return;
    }
    
    const { notificationId, userId } = job.data; 

    const { deliveries, notification }  = await prisma.$transaction(
        async (tx) => {

            const deliveries = await tx.notificationDelivery.findMany({
                where: {
                    notificationId: notificationId
                }
            });

            const notification = await tx.notification.update({
                where: {
                    id: notificationId
                },
                data: {
                    status: NotificationStatus.PROCESSING
                }
            });

            return { deliveries, notification };
        }
    )

    if (!notification) {
        console.error(`[Notification Processor] Notification not found for id: ${notificationId}`);
        return;
    }

    if (!deliveries) {
        console.error(`[Notification Processor] No deliveries found for notification id: ${notificationId}`);
        return;
    }

    const failedDeliveries: {id : string, error : string}[] = [];
    for (const delivery of deliveries) {
        if (delivery.status === DeliveryStatus.SENT) continue;

        const providerFn = ChannelProvider[delivery.channel];

        const { success, error, providerMessageId } = await providerFn(delivery, notification, userId);
        if (!success) {
            console.error(`[Notification Processor] Failed to deliver : ${delivery.id} via ${delivery.channel} : ${error}`);
            failedDeliveries.push({ id: delivery.id, error: error || "Unknown error" });
            continue;
        }

        const updateStatus = await prisma.notificationDelivery.update({
            where: {
                id : delivery.id
            },
            data: {
                status: DeliveryStatus.SENT,
                sentAt: new Date(),
                providerMessageId : providerMessageId || "Provider did not return a message id"
            }
        })
        
    }

    if (failedDeliveries.length > 0) {
        const maxAttempts = job.opts.attempts || 1;
        const isLastAttempt = job.attemptsMade >= maxAttempts - 1;

        if (isLastAttempt) {
            // update all the deliveries in failedDeliveries and the notification status to FAILED
            await prisma.$transaction(
                failedDeliveries.map((failedDelivery) => {
                    return prisma.notificationDelivery.update({
                        where: {
                            id: failedDelivery.id
                        },
                        data: {
                            status: DeliveryStatus.FAILED,
                            error : failedDelivery.error
                        }
                    });
                })
            );

            await prisma.notification.update({
                where: {
                    id : notification.id
                },
                data: {
                    status : NotificationStatus.FAILED
                }
            })
        } else {
            await prisma.notification.update({
                where: {
                   id : notification.id
                },
                data: {
                    status : NotificationStatus.RETRYING
                }
            })
        
        }

        const errorMessages = failedDeliveries.map(f => f.error);
        throw new Error(`Failed to deliver: ${errorMessages.join(', ')}`);
    }

    const updateNotificationStatus = await prisma.notification.update({
        where: {
            id : notification.id
        },
        data: {
            status : NotificationStatus.SENT
        }
    })

    console.log(`[Notification Processor] Job completed for : ${job.id}`);
    
}