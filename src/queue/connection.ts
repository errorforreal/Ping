import type { ConnectionOptions } from "bullmq";
import { Queue } from "bullmq";

export const connection: ConnectionOptions = {
    url: process.env.REDIS_URL!,
    maxRetriesPerRequest: null
}

export const notificationQueue = new Queue("notifications", {
    connection
} );