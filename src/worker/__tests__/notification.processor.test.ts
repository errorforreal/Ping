import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processNotificationJob } from '../notification.processor.js';
import prisma from '../../lib/prisma.js';
import { ChannelProvider } from '../../providers/index.js';
import { ChannelType, DeliveryStatus, NotificationStatus } from '../../generated/prisma/enums.js';
import type { Job } from 'bullmq';

vi.mock('../../lib/prisma.js', () => ({
    default: {
        $transaction: vi.fn(),
        notificationDelivery: { update: vi.fn() },
        notification: { update: vi.fn() }
    }
}));

vi.mock('../../providers/index.js', () => {
    return {
        ChannelProvider: {
            EMAIL: vi.fn(),
            SMS: vi.fn()
        }
    };
});

describe('Notification Processor', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const mockJob = {
        id: 'job_1',
        name: 'notification-event',
        data: { notificationId: 'notif_1', userId: 'user_1' },
        attemptsMade: 1,
        opts: { attempts: 5 }
    } as unknown as Job;

    const mockDeliveries = [
        { id: 'del_email', channel: ChannelType.EMAIL, status: DeliveryStatus.PENDING },
        { id: 'del_sms', channel: ChannelType.SMS, status: DeliveryStatus.PENDING }
    ];

    const mockNotification = { id: 'notif_1', status: NotificationStatus.PROCESSING };

    it('should skip deliveries that are already SENT (Idempotency)', async () => {
        // Mock $transaction to return deliveries where EMAIL is already SENT
        vi.mocked(prisma.$transaction).mockResolvedValueOnce({
            deliveries: [
                { id: 'del_email', channel: ChannelType.EMAIL, status: DeliveryStatus.SENT },
                { id: 'del_sms', channel: ChannelType.SMS, status: DeliveryStatus.PENDING }
            ],
            notification: mockNotification
        });

        vi.mocked(ChannelProvider.SMS).mockResolvedValueOnce({ success: true, providerMessageId: 'sms_123' });

        await processNotificationJob(mockJob);

        // Expect EMAIL provider to NOT be called
        expect(ChannelProvider.EMAIL).not.toHaveBeenCalled();
        // Expect SMS provider TO be called
        expect(ChannelProvider.SMS).toHaveBeenCalled();
        
        // Assert notification marked SENT at the end
        expect(prisma.notification.update).toHaveBeenCalledWith(expect.objectContaining({
            data: { status: NotificationStatus.SENT }
        }));
    });

    it('should throw error and update to RETRYING on partial failure', async () => {
        vi.mocked(prisma.$transaction).mockResolvedValueOnce({
            deliveries: mockDeliveries,
            notification: mockNotification
        });

        // Email succeeds, SMS fails
        vi.mocked(ChannelProvider.EMAIL).mockResolvedValueOnce({ success: true });
        vi.mocked(ChannelProvider.SMS).mockResolvedValueOnce({ success: false, error: 'Twilio Down' });

        // Assert it throws error for BullMQ
        await expect(processNotificationJob(mockJob)).rejects.toThrow('Failed to deliver: Twilio Down');

        // Assert parent notification is marked RETRYING
        expect(prisma.notification.update).toHaveBeenCalledWith(expect.objectContaining({
            data: { status: NotificationStatus.RETRYING }
        }));
    });

    it('should mark completely FAILED on last attempt', async () => {
        vi.mocked(prisma.$transaction).mockResolvedValueOnce({
            deliveries: mockDeliveries,
            notification: mockNotification
        });

        vi.mocked(ChannelProvider.EMAIL).mockResolvedValueOnce({ success: false, error: 'Bad Email' });
        vi.mocked(ChannelProvider.SMS).mockResolvedValueOnce({ success: false, error: 'Bad Phone' });

        const lastAttemptJob = { ...mockJob, attemptsMade: 4 } as unknown as Job;

        await expect(processNotificationJob(lastAttemptJob)).rejects.toThrow();

        // Assert parent notification is permanently marked FAILED
        expect(prisma.notification.update).toHaveBeenCalledWith(expect.objectContaining({
            data: { status: NotificationStatus.FAILED }
        }));
    });
});
