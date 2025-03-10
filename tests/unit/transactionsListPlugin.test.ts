import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";
import transactionsListPlugin from '../../src/plugins/transactionsListPlugin.js'
import data from '../../transactions-v2.1.json' with { type: 'json' };
import { FastifyInstance } from "fastify";
import { createServer } from "../../src/server.js";
import { beforeEach } from "vitest";

describe('Transactions List Plugin', () => {
    let server: FastifyInstance;

    beforeAll(async () => {
        server = await createServer(false);
        await server.register(transactionsListPlugin);
        await server.ready();
    });

    afterAll(() => {
        vi.restoreAllMocks();
        server.close();
    })

    beforeEach(() => {
        global.fetch = vi.fn();
    });

    test('should register the plugin and expose getTransactions()', () => {
        expect(server.getTransactions).toBeDefined();
        expect(typeof server.getTransactions).toBe('function');
    });

    test('should correctly return the transactions list', async () => {
        const transactions = await server.getTransactions(false);
        expect(transactions).toStrictEqual(data);
    });

    test('should correctly fetch and validate when calling the external API', async () => {
        const testData = [
            { transactionId: 1, authorizationCode: 'ABC123', transactionDate: '2025-03-09T00:00:00Z', customerId: 456, transactionType: 'WIRE_OUTGOING', transactionStatus: 'SETTLED', description: 'Test Transaction', amount: 100, metadata: {} }
        ];

        vi.spyOn(global, 'fetch').mockImplementationOnce(() =>
            Promise.resolve({
                ok: true,
                status: 200,
                statusText: 'OK',
                headers: new Headers({ 'Content-Type': 'application/json' }),
                json: () => Promise.resolve(testData),
                redirected: false,
                type: 'basic',
                url: '',
                clone: () => new Response(JSON.stringify(testData), { status: 200, headers: { 'Content-Type': 'application/json' } })
            } as Response)
        );

        const transactions = await server.getTransactions(true);
        expect(transactions).toStrictEqual(testData);
    });

    test('should filter out invalid responses from the external API', async () => {
        const invalidStatusTestData = [
            { transactionId: 1, authorizationCode: 'ABC123', transactionDate: '2025-03-09T00:00:00Z', customerId: 456, transactionType: 'WIRE_OUTGOING', transactionStatus: 'INVALID_STATUS', description: 'Test Transaction', amount: 100, metadata: {} },
            { transactionId: 2, authorizationCode: 'ABC123', transactionDate: '2025-03-09T00:00:00Z', customerId: 456, transactionType: 'WIRE_OUTGOING', transactionStatus: 'SETTLED', description: 'Test Transaction', amount: 100, metadata: {} }
        ];

        vi.spyOn(global, 'fetch').mockImplementationOnce(() =>
            Promise.resolve({
                ok: true,
                status: 200,
                statusText: 'OK',
                headers: new Headers({ 'Content-Type': 'application/json' }),
                json: () => Promise.resolve(invalidStatusTestData),
                redirected: false,
                type: 'basic',
                url: '',
                clone: () => new Response(JSON.stringify(invalidStatusTestData), { status: 200, headers: { 'Content-Type': 'application/json' } })
            } as Response)
        );

        const transactions = await server.getTransactions(true);
        expect(transactions).toHaveLength(1);
        expect(transactions[0].transactionId).toBe(2);
    });

    test('should fallback to local data when the external API response fails', async () => {
        const logSpy = vi.spyOn(server.log, 'warn');

        vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Mock Network Failure'));

        const transactions = await server.getTransactions(true);
        expect(transactions).toStrictEqual(data);
        expect(logSpy).toHaveBeenCalledWith(new Error('Mock Network Failure'), expect.stringContaining('Falling back to local data'));
    });

    test('should return an empty array when the external API response does not return a valid JSON Array', async () => {
        vi.spyOn(global, 'fetch').mockImplementationOnce(() =>
            Promise.resolve({
                ok: true,
                status: 200,
                statusText: 'OK',
                headers: new Headers({ 'Content-Type': 'application/json' }),
                json: () => Promise.resolve({ key: 'value' }),
                redirected: false,
                type: 'basic',
                url: '',
                clone: () => new Response(JSON.stringify({ key: 'value' }), { status: 200, headers: { 'Content-Type': 'application/json' } })
            } as Response)
        );

        const transactions = await server.getTransactions(true);
        expect(transactions).toHaveLength(0);
    });
});
