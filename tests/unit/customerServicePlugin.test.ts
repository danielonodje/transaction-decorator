import Fastify, { FastifyInstance } from 'fastify';
import { vi, describe, beforeEach, test, expect } from 'vitest';
import customerServicePlugin, { CustomerService } from '../../src/plugins/customerService.js';

describe('customerService Plugin', () => {
    let fastify: FastifyInstance;

    beforeEach(async () => {
        fastify = Fastify();
        await fastify.register(customerServicePlugin);
    });

    test('should register the plugin correctly', async () => {
        expect(fastify.hasDecorator('customerService')).toBe(false);
        fastify.getTransactions = vi.fn().mockResolvedValue([]);
        await fastify.ready();
        expect(fastify.hasDecorator('customerService')).toBe(true);
    });

    test('should log messages onReady', async () => {
        const logSpy = vi.spyOn(fastify.log, 'info');
        fastify.getTransactions = vi.fn().mockResolvedValue([
            { transactionId: 1, authorizationCode: 'ABC123', transactionDate: '2025-03-09T00:00:00Z', customerId: 456, transactionType: 'WIRE_OUTGOING', transactionStatus: 'PENDING', description: 'Test Transaction', amount: 100, metadata: {} }
        ]);

        await fastify.ready();

        expect(logSpy).toHaveBeenCalledWith('Fetching Transaction Information');
        expect(logSpy).toHaveBeenCalledWith(expect.stringMatching(/Fetched 1 transactions\./));
    });

    test('should fetch transactions and decorate customerService', async () => {
        const mock = vi.fn().mockResolvedValue([]);

        fastify.getTransactions = mock;

        await fastify.ready();

        expect(fastify.customerService).toBeInstanceOf(CustomerService);
        expect(mock).toBeCalledTimes(1);
    });

    test('should log warning when fetching transactions fails', async () => {
        const error = new Error('Database Error');
        fastify.getTransactions = vi.fn().mockRejectedValue(error);
        const logSpy = vi.spyOn(fastify.log, 'error');

        await fastify.ready();
        expect(logSpy).toHaveBeenCalledWith(
            expect.stringContaining('Failed to fetch transactions'),
            error
        );
    });
});
