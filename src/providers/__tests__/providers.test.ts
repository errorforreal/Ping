import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendEmail } from '../email.js';
import { sendSms } from '../sms.js';
import { ChannelType, DeliveryStatus } from '../../generated/prisma/enums.js';
import prisma from '../../lib/prisma.js';
import { Resend } from 'resend';
import twilio from 'twilio';

// Mock dependencies
vi.mock('../../lib/prisma.js', () => ({
    default: {
        userChannel: {
            findUnique: vi.fn(),
        }
    }
}));

vi.mock('resend', () => {
    return {
        Resend: class {
            emails = { send: vi.fn() }
        }
    };
});

vi.mock('twilio', () => {
    const createMock = vi.fn();
    return {
        default: vi.fn().mockReturnValue({
            messages: { create: createMock }
        })
    };
});

describe('Providers', () => {
    const mockDelivery = {
        id: 'delivery_1',
        notificationId: 'notif_1',
        channel: ChannelType.EMAIL,
        status: DeliveryStatus.PENDING,
        providerMessageId: null,
        error: null,
        sentAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
    };

    const mockNotification = {
        id: 'notif_1',
        tenantId: 'tenant_1',
        userId: 'user_1',
        type: 'ALERT',
        title: 'Test',
        message: 'Hello',
        idempotencyKey: null,
        bullJobId: null,
        status: 'PENDING' as any,
        createdAt: new Date(),
        updatedAt: new Date()
    };

    beforeEach(() => {
        vi.clearAllMocks();
        // Set environment variables for tests
        process.env.EMAIL_FROM = 'test@example.com';
        process.env.TWILIO_ACCOUNT_SID = 'sid';
        process.env.TWILIO_AUTH_TOKEN = 'token';
        process.env.SMS_FROM = '+1234567890';
    });

    describe('Email Provider', () => {
        it('should return error if user has no email channel', async () => {
            vi.mocked(prisma.userChannel.findUnique).mockResolvedValueOnce(null);
            const result = await sendEmail(mockDelivery, mockNotification, 'user_1');
            expect(result.success).toBe(false);
        });
    });

    describe('SMS Provider', () => {
        it('should return error if user has no sms channel', async () => {
            vi.mocked(prisma.userChannel.findUnique).mockResolvedValueOnce(null);
            const result = await sendSms({ ...mockDelivery, channel: ChannelType.SMS }, mockNotification, 'user_1');
            expect(result.success).toBe(false);
        });
    });
});
