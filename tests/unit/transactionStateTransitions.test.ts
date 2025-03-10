import { describe, expect, test } from "vitest";
import { validateTransactionStatusTransition } from '../../src/utils/transactionStatusValidation.js';
import { Transaction } from "../../src/schemas.js";

describe('Transaction Chain Status Transition Validation', () => {
    describe('Ensure valid status transitions pass', () => {
        const validTransitions: [string, Transaction[]][] = [
            ['PENDING -> SETTLED', [
                { transactionId: 1, authorizationCode: 'ABC123', transactionDate: '2025-03-09T00:00:00Z', customerId: 456, transactionType: 'WIRE_OUTGOING', transactionStatus: 'PENDING', description: 'Test Transaction', amount: 100, metadata: {} },
                { transactionId: 2, authorizationCode: 'ABC123', transactionDate: '2025-03-09T00:00:00Z', customerId: 456, transactionType: 'WIRE_OUTGOING', transactionStatus: 'SETTLED', description: 'Test Transaction', amount: 100, metadata: {} }
            ]],
            ['PENDING -> DECLINED', [
                { transactionId: 1, authorizationCode: 'ABC123', transactionDate: '2025-03-09T00:00:00Z', customerId: 456, transactionType: 'WIRE_OUTGOING', transactionStatus: 'PENDING', description: 'Test Transaction', amount: 100, metadata: {} },
                { transactionId: 2, authorizationCode: 'ABC123', transactionDate: '2025-03-09T00:00:00Z', customerId: 456, transactionType: 'WIRE_OUTGOING', transactionStatus: 'DECLINED', description: 'Test Transaction', amount: 100, metadata: {} }
            ]],
            ['PENDING -> CANCELED', [
                { transactionId: 1, authorizationCode: 'ABC123', transactionDate: '2025-03-09T00:00:00Z', customerId: 456, transactionType: 'WIRE_OUTGOING', transactionStatus: 'PENDING', description: 'Test Transaction', amount: 100, metadata: {} },
                { transactionId: 2, authorizationCode: 'ABC123', transactionDate: '2025-03-09T00:00:00Z', customerId: 456, transactionType: 'WIRE_OUTGOING', transactionStatus: 'CANCELED', description: 'Test Transaction', amount: 100, metadata: {} }
            ]],
            ['PENDING -> SETTLED -> RETURNED', [
                { transactionId: 1, authorizationCode: 'ABC123', transactionDate: '2025-03-09T00:00:00Z', customerId: 456, transactionType: 'WIRE_OUTGOING', transactionStatus: 'PENDING', description: 'Test Transaction', amount: 100, metadata: {} },
                { transactionId: 2, authorizationCode: 'ABC123', transactionDate: '2025-03-09T00:00:00Z', customerId: 456, transactionType: 'WIRE_OUTGOING', transactionStatus: 'SETTLED', description: 'Test Transaction', amount: 100, metadata: {} },
                { transactionId: 2, authorizationCode: 'ABC123', transactionDate: '2025-03-09T00:00:00Z', customerId: 456, transactionType: 'WIRE_OUTGOING', transactionStatus: 'RETURNED', description: 'Test Transaction', amount: 100, metadata: {} }
            ]],
            ['SETTLED', [
                { transactionId: 2, authorizationCode: 'ABC123', transactionDate: '2025-03-09T00:00:00Z', customerId: 456, transactionType: 'WIRE_OUTGOING', transactionStatus: 'SETTLED', description: 'Test Transaction', amount: 100, metadata: {} }
            ]],
            ['SETTLED -> RETURNED', [
                { transactionId: 2, authorizationCode: 'ABC123', transactionDate: '2025-03-09T00:00:00Z', customerId: 456, transactionType: 'WIRE_OUTGOING', transactionStatus: 'SETTLED', description: 'Test Transaction', amount: 100, metadata: {} },
                { transactionId: 2, authorizationCode: 'ABC123', transactionDate: '2025-03-09T00:00:00Z', customerId: 456, transactionType: 'WIRE_OUTGOING', transactionStatus: 'RETURNED', description: 'Test Transaction', amount: 100, metadata: {} }
            ]]
        ];

        test.each(validTransitions)(
            '%s',
            (transitionName: string, txChain: Transaction[]) => {
                expect(validateTransactionStatusTransition(txChain)).toBe(true);
            }
        );
    });

    describe('Ensure invalid status transitions fail', () => {
        const invalidTransitions: [string, Transaction[]][] = [
            // Illegal Start states
            ['Illegal Start: DECLINED', [
                { transactionId: 2, authorizationCode: 'ABC123', transactionDate: '2025-03-09T00:00:00Z', customerId: 456, transactionType: 'WIRE_OUTGOING', transactionStatus: 'DECLINED', description: 'Test Transaction', amount: 100, metadata: {} }
            ]],
            ['Illegal Start: CANCELED', [
                { transactionId: 2, authorizationCode: 'ABC123', transactionDate: '2025-03-09T00:00:00Z', customerId: 456, transactionType: 'WIRE_OUTGOING', transactionStatus: 'CANCELED', description: 'Test Transaction', amount: 100, metadata: {} }
            ]],
            ['Illegal Start: RETURNED', [
                { transactionId: 2, authorizationCode: 'ABC123', transactionDate: '2025-03-09T00:00:00Z', customerId: 456, transactionType: 'WIRE_OUTGOING', transactionStatus: 'RETURNED', description: 'Test Transaction', amount: 100, metadata: {} }
            ]],
            ['Illegal Terminal state: PENDING', [
                { transactionId: 2, authorizationCode: 'ABC123', transactionDate: '2025-03-09T00:00:00Z', customerId: 456, transactionType: 'WIRE_OUTGOING', transactionStatus: 'PENDING', description: 'Test Transaction', amount: 100, metadata: {} }
            ]],
            ['Illegal Transitions between Terminal states: DECLINED -> CANCELED', [
                { transactionId: 1, authorizationCode: 'ABC123', transactionDate: '2025-03-09T00:00:00Z', customerId: 456, transactionType: 'WIRE_OUTGOING', transactionStatus: 'DECLINED', description: 'Test Transaction', amount: 100, metadata: {} },
                { transactionId: 2, authorizationCode: 'ABC123', transactionDate: '2025-03-09T00:00:00Z', customerId: 456, transactionType: 'WIRE_OUTGOING', transactionStatus: 'CANCELED', description: 'Test Transaction', amount: 100, metadata: {} }
            ]],
            ['Illegal Transitions between Terminal states: CANCELED -> RETURNED', [
                { transactionId: 1, authorizationCode: 'ABC123', transactionDate: '2025-03-09T00:00:00Z', customerId: 456, transactionType: 'WIRE_OUTGOING', transactionStatus: 'CANCELED', description: 'Test Transaction', amount: 100, metadata: {} },
                { transactionId: 2, authorizationCode: 'ABC123', transactionDate: '2025-03-09T00:00:00Z', customerId: 456, transactionType: 'WIRE_OUTGOING', transactionStatus: 'RETURNED', description: 'Test Transaction', amount: 100, metadata: {} }
            ]],
            ['Skips a state: PENDING -> RETURNED', [
                { transactionId: 1, authorizationCode: 'ABC123', transactionDate: '2025-03-09T00:00:00Z', customerId: 456, transactionType: 'WIRE_OUTGOING', transactionStatus: 'PENDING', description: 'Test Transaction', amount: 100, metadata: {} },
                { transactionId: 2, authorizationCode: 'ABC123', transactionDate: '2025-03-09T00:00:00Z', customerId: 456, transactionType: 'WIRE_OUTGOING', transactionStatus: 'RETURNED', description: 'Test Transaction', amount: 100, metadata: {} }
            ]],
            ['Tries to return to non-Terminal state after termination: PENDING -> SETTLED -> RETURNED -> PENDING', [
                { transactionId: 1, authorizationCode: 'ABC123', transactionDate: '2025-03-09T00:00:00Z', customerId: 456, transactionType: 'WIRE_OUTGOING', transactionStatus: 'PENDING', description: 'Test Transaction', amount: 100, metadata: {} },
                { transactionId: 2, authorizationCode: 'ABC123', transactionDate: '2025-03-09T00:00:00Z', customerId: 456, transactionType: 'WIRE_OUTGOING', transactionStatus: 'SETTLED', description: 'Test Transaction', amount: 100, metadata: {} },
                { transactionId: 2, authorizationCode: 'ABC123', transactionDate: '2025-03-09T00:00:00Z', customerId: 456, transactionType: 'WIRE_OUTGOING', transactionStatus: 'RETURNED', description: 'Test Transaction', amount: 100, metadata: {} },
                { transactionId: 1, authorizationCode: 'ABC123', transactionDate: '2025-03-09T00:00:00Z', customerId: 456, transactionType: 'WIRE_OUTGOING', transactionStatus: 'PENDING', description: 'Test Transaction', amount: 100, metadata: {} }
            ]]
        ];

        test.each(invalidTransitions)(
            '%s',
            (transitionName: string, txChain: Transaction[]) => {
                expect(validateTransactionStatusTransition(txChain)).toBe(false);
            }
        );
    });
});