import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runSweeperLogic } from '../sweeper.js';
import prisma from '../../lib/prisma.js';
import { queueEvent } from '../../queue/notification.queue.js';
import { Prisma } from '../../generated/prisma/client.js';

vi.mock('../../lib/prisma.js', () => ({
    default: {
        notification: { findMany: vi.fn() }
    }
}));

vi.mock('../../queue/notification.queue.js', () => ({
    queueEvent: vi.fn()
}));

describe('Sweeper Logic', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return success true if no stuck notifications found', async () => {
        vi.mocked(prisma.notification.findMany).mockResolvedValueOnce([]);
        
        const result = await runSweeperLogic();
        
        expect(result).toEqual({ success: true });
        expect(queueEvent).not.toHaveBeenCalled();
    });

    it('should queue stuck notifications and return true', async () => {
        const mockStuckNotifications = [
            { id: 'notif_1', userId: 'user_1', tenantId: 'tenant_1' },
            { id: 'notif_2', userId: 'user_2', tenantId: 'tenant_1' }
        ] as any[];

        vi.mocked(prisma.notification.findMany).mockResolvedValueOnce(mockStuckNotifications);
        vi.mocked(queueEvent).mockResolvedValue({ success: true, jobId: 'job_xyz' });

        const result = await runSweeperLogic();
        
        expect(result).toEqual({ success: true });
        expect(queueEvent).toHaveBeenCalledTimes(2);
    });

    it('should continue processing even if one queueEvent fails', async () => {
        const mockStuckNotifications = [
            { id: 'notif_1', userId: 'user_1', tenantId: 'tenant_1' },
            { id: 'notif_2', userId: 'user_2', tenantId: 'tenant_1' }
        ] as any[];

        vi.mocked(prisma.notification.findMany).mockResolvedValueOnce(mockStuckNotifications);
        
        // First fails, second succeeds
        vi.mocked(queueEvent)
            .mockResolvedValueOnce({ success: false, reason: 'enqueue error' })
            .mockResolvedValueOnce({ success: true, jobId: 'job_xyz' });

        const result = await runSweeperLogic();
        
        expect(result).toEqual({ success: true }); // Still returns true!
        expect(queueEvent).toHaveBeenCalledTimes(2); // Still tried to process the second one!
    });

    it('should return false if database query fails completely', async () => {
        vi.mocked(prisma.notification.findMany).mockRejectedValueOnce(
            new Prisma.PrismaClientKnownRequestError('DB down', { code: 'P2002', clientVersion: '7.7.0' })
        );

        const result = await runSweeperLogic();
        
        expect(result.success).toBe(false);
        expect(result.error).toContain('Failed to fetch stuckNotifications');
    });
});
