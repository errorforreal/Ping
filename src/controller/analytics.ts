import type { Request, Response } from "express";
import prisma from "../lib/prisma.js";

export async function getAnalytics(req: Request, res: Response) {
    const tenantId = (req as any).tenant.id;

    try {
        const totalSent = await prisma.notification.count({ where: { tenantId } });
        const failedCount = await prisma.notification.count({ where: { tenantId, status: "FAILED" } });
        const successRate = totalSent === 0 ? "0%" : `${(((totalSent - failedCount) / totalSent) * 100).toFixed(1)}%`;

        // Fetch recent deliveries for this tenant by joining through the Notification model
        const recentDeliveries = await prisma.notificationDelivery.findMany({
            where: { 
                notification: {
                    tenantId: tenantId
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 20,
            include: {
                notification: {
                    include: {
                        user: {
                            include: {
                                channels: true
                            }
                        }
                    }
                }
            }
        });

        const mappedDeliveries = recentDeliveries.map(delivery => {
            // Find the specific channel value (e.g., the email address or phone number) for this delivery
            const userChannel = delivery.notification.user.channels.find(
                (c: any) => c.type === delivery.channel
            );

            return {
                id: delivery.id,
                channel: delivery.channel,
                status: delivery.status,
                timestamp: delivery.createdAt.toISOString(),
                recipient: userChannel ? userChannel.value : 'Unknown'
            };
        });

        return res.status(200).json({
            stats: {
                total: totalSent.toString(),
                successRate,
                failed: failedCount.toString()
            },
            deliveries: mappedDeliveries
        });
    } catch (err) {
        console.error("Analytics error:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
}
