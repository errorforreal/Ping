import { describe, it, expect } from 'vitest';
import { payloadSchema } from '../../services/authenticatPayload.js';

describe('Payload Validation', () => {
    it('should validate a perfect payload', () => {
        const validPayload = {
            user: {
                id: 'user_123',
                email: 'test@example.com',
                phone: '+1234567890'
            },
            notification: {
                type: 'ALERT',
                title: 'Test',
                message: 'Hello'
            },
            channels: ['EMAIL', 'SMS']
        };

        const result = payloadSchema.safeParse(validPayload);
        expect(result.success).toBe(true);
    });

    it('should fail if an invalid channel is provided', () => {
        const invalidPayload = {
            user: { id: 'user_123', email: 'test@example.com' },
            notification: { type: 'ALERT', title: 'Test', message: 'Hello' },
            channels: ['ABC']
        };

        const result = payloadSchema.safeParse(invalidPayload);
        expect(result.success).toBe(false);
    });

    it('should fail if channels array is empty', () => {
        const invalidPayload = {
            user: { id: 'user_123', email: 'test@example.com' },
            notification: { type: 'ALERT', title: 'Test', message: 'Hello' },
            channels: []
        };

        const result = payloadSchema.safeParse(invalidPayload);
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0]?.code).toBe('too_small');
        }
    });

    it('should fail if EMAIL channel requested but no email provided', () => {
        const invalidPayload = {
            user: { id: 'user_123', phone: '+1234567890' }, // No email
            notification: { type: 'ALERT', title: 'Test', message: 'Hello' },
            channels: ['EMAIL']
        };

        const result = payloadSchema.safeParse(invalidPayload);
        expect(result.success).toBe(false);
    });

    it('normalizes surrounding whitespace and rejects non-E.164 phone numbers', () => {
        const base = {
            user: { id: 'user_123', phone: '  +14155550199  ' },
            notification: { type: 'ALERT', title: 'Test', message: 'Hello' },
            channels: ['SMS']
        };

        const valid = payloadSchema.safeParse(base);
        expect(valid.success).toBe(true);
        if (valid.success) expect(valid.data.user.phone).toBe('+14155550199');

        expect(payloadSchema.safeParse({ ...base, user: { ...base.user, phone: '415-555-0199' } }).success).toBe(false);
        expect(payloadSchema.safeParse({ ...base, user: { ...base.user, phone: '+0123456789' } }).success).toBe(false);
    });
});
