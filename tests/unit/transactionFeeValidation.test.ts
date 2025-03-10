import { describe, expect, test } from "vitest";
import { validateTransactionAmount } from '../../src/utils/transactionFeeValidation.js';
import { Transaction } from "../../src/schemas.js";

describe('Transaction Chain Amount Validation', () => {
    test('returns true for an empty transaction list', () => {
        expect(validateTransactionAmount([])).toBe(true);
    });

    test('returns true for a single transaction in the chain', () => {
        const transactions: Transaction[] = [
            { transactionId: 1, authorizationCode: "AUTH1", transactionDate: "2024-01-01", customerId: 1, transactionType: "POS", transactionStatus: "PENDING", description: "Purchase", amount: 100, metadata: {} }
        ];
        expect(validateTransactionAmount(transactions)).toBe(true);
    });

    test('returns true for multiple fee transactions, all correctly linked', () => {
        const transactions: Transaction[] = [
            { transactionId: 1, authorizationCode: "AUTH1", transactionDate: "2024-01-01", customerId: 1, transactionType: "POS", transactionStatus: "SETTLED", description: "Purchase", amount: 100, metadata: {} },
            { transactionId: 2, authorizationCode: "AUTH2", transactionDate: "2024-01-02", customerId: 1, transactionType: "POS", transactionStatus: "SETTLED", description: "Another Purchase", amount: 100, metadata: {} },
            { transactionId: 3, authorizationCode: "AUTH3", transactionDate: "2024-01-02", customerId: 1, transactionType: "FEE", transactionStatus: "SETTLED", description: "Fee for tx1", amount: 5, metadata: { relatedTransactionId: 1 } },
            { transactionId: 4, authorizationCode: "AUTH4", transactionDate: "2024-01-02", customerId: 1, transactionType: "FEE", transactionStatus: "SETTLED", description: "Fee for tx2", amount: 5, metadata: { relatedTransactionId: 2 } }
        ];
        expect(validateTransactionAmount(transactions)).toBe(true);
    });

    test('returns false for multiple fee transactions where at least one is missing a related transaction', () => {
        const transactions: Transaction[] = [
            { transactionId: 1, authorizationCode: "AUTH1", transactionDate: "2024-01-01", customerId: 1, transactionType: "POS", transactionStatus: "SETTLED", description: "Purchase", amount: 100, metadata: {} },
            { transactionId: 2, authorizationCode: "AUTH2", transactionDate: "2024-01-02", customerId: 1, transactionType: "FEE", transactionStatus: "SETTLED", description: "Valid fee", amount: 5, metadata: { relatedTransactionId: 1 } },
            { transactionId: 3, authorizationCode: "AUTH3", transactionDate: "2024-01-02", customerId: 1, transactionType: "FEE", transactionStatus: "SETTLED", description: "Invalid fee", amount: 10, metadata: {} }
        ];
        expect(validateTransactionAmount(transactions)).toBe(false);
    });

    test('returns false for multiple fee transactions where at least one is has an invalid a related transaction id', () => {
        const transactions: Transaction[] = [
            { transactionId: 1, authorizationCode: "AUTH1", transactionDate: "2024-01-01", customerId: 1, transactionType: "POS", transactionStatus: "SETTLED", description: "Purchase", amount: 100, metadata: {} },
            { transactionId: 2, authorizationCode: "AUTH2", transactionDate: "2024-01-02", customerId: 1, transactionType: "FEE", transactionStatus: "SETTLED", description: "Valid fee", amount: 5, metadata: { relatedTransactionId: 1 } },
            { transactionId: 3, authorizationCode: "AUTH3", transactionDate: "2024-01-02", customerId: 1, transactionType: "FEE", transactionStatus: "SETTLED", description: "Invalid fee", amount: 10, metadata: { relatedTransactionId: 4 } }
        ];
        expect(validateTransactionAmount(transactions)).toBe(false);
    });

    test('returns true when different transaction types have the same amounts', () => {
        const transactions: Transaction[] = [
            { transactionId: 1, authorizationCode: "AUTH1", transactionDate: "2024-01-01", customerId: 1, transactionType: "POS", transactionStatus: "SETTLED", description: "Purchase", amount: 100, metadata: {} },
            { transactionId: 2, authorizationCode: "AUTH2", transactionDate: "2024-01-02", customerId: 1, transactionType: "WIRE_OUTGOING", transactionStatus: "SETTLED", description: "Wire Transfer", amount: 100, metadata: {} }
        ];
        expect(validateTransactionAmount(transactions)).toBe(true);
    });

    test('returns false if at least one transaction of the same type has a different amount', () => {
        const transactions: Transaction[] = [
            { transactionId: 1, authorizationCode: "AUTH1", transactionDate: "2024-01-01", customerId: 1, transactionType: "POS", transactionStatus: "SETTLED", description: "Purchase", amount: 50, metadata: {} },
            { transactionId: 2, authorizationCode: "AUTH2", transactionDate: "2024-01-02", customerId: 1, transactionType: "POS", transactionStatus: "SETTLED", description: "Another Purchase", amount: 60, metadata: {} } // Different amount
        ];
        expect(validateTransactionAmount(transactions)).toBe(false);
    });
});
