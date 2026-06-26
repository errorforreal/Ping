import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { handleNotify } from '../notification.js';
import prisma from '../../lib/prisma.js';
import { queueEvent } from '../../queue/notification.queue.js';

// Setup Express app for testing
const app = express();
app.use(express.json());

// Mock middleware to inject tenantId
app.use((req, res, next) => {
    req.tenantId = req.headers['x-tenant-id'] as string;
    next();
});
app.post('/api/notify/v1', handleNotify);

// Mock dependencies
vi.mock('../../lib/prisma.js', () => ({
    default: {
        tenant: { findUnique: vi.fn() },
        $transaction: vi.fn()
    }
}));

vi.mock('../../queue/notification.queue.js', () => ({
    queueEvent: vi.fn()
}));

describe('Notification Controller', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return 403 if tenant ID is missing', async () => {
        const response = await request(app)
            .post('/api/notify/v1')
            .send({});
        
        expect(response.status).toBe(403);
        expect(response.body.message).toBe('Tenant not found! Check Api key');
    });

    it('should return 400 for invalid payload (Zod Error)', async () => {
        vi.mocked(prisma.tenant.findUnique).mockResolvedValueOnce({ id: 'tenant_1' } as any);

        const invalidPayload = {
            user: { id: 'user_1' }, // Missing email/phone
            notification: { type: 'ALERT', title: 'Test', message: 'Hello' },
            channels: ['EMAIL']
        };

        const response = await request(app)
            .post('/api/notify/v1')
            .set('x-tenant-id', 'tenant_1')
            .send(invalidPayload);
        
        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Invalid notification payload');
    });

    it('should return 201 and queue job for valid payload', async () => {
        vi.mocked(prisma.tenant.findUnique).mockResolvedValueOnce({ id: 'tenant_1' } as any);
        
        // Mock the two transactions
        vi.mocked(prisma.$transaction)
            .mockResolvedValueOnce({ id: 'user_1' }) // User transaction
            .mockResolvedValueOnce({ id: 'notif_1' }); // Notification transaction

        vi.mocked(queueEvent).mockResolvedValueOnce({ success: true, jobId: 'job_123' });

        const validPayload = {
            user: { id: 'user_1', email: 'test@example.com' },
            notification: { type: 'ALERT', title: 'Test', message: 'Hello' },
            channels: ['EMAIL']
        };

        const response = await request(app)
            .post('/api/notify/v1')
            .set('x-tenant-id', 'tenant_1')
            .send(validPayload);
        
        expect(response.status).toBe(201);
        expect(response.body.jobId).toBe('job_123');
        expect(queueEvent).toHaveBeenCalledWith({
            userId: 'user_1',
            notificationId: 'notif_1',
            tenantId: 'tenant_1'
        });
    });
});
