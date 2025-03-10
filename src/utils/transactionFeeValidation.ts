import { Transaction } from '../schemas.js';

export function validateTransactionAmount(transactions: Transaction[]) {
    // Verify that a main transaction exists for a fee transaction
    const transactionMap = new Map<number, Transaction>();
    for (const tx of transactions) {
        transactionMap.set(tx.transactionId, tx);
    }

    const feeTransactions = transactions.filter(tx => tx.transactionType === 'FEE');
    for (const feeTx of feeTransactions) {
        const relatedId = feeTx.metadata?.relatedTransactionId;
        if (!relatedId || !transactionMap.has(relatedId)) {
            return false;
        }
    }

    // Check if amounts are consistent when the transaction types are the same
    const nonFeeTransactions = transactions.filter(tx => tx.transactionType !== 'FEE');
    if (nonFeeTransactions.length > 1) {
        for (let i = 1; i < nonFeeTransactions.length; i++) {
            const prevTx = nonFeeTransactions[i - 1];
            const currTx = nonFeeTransactions[i];

            // If both transactions have the same transactionType and the amounts differ flag it
            if (prevTx.transactionType === currTx.transactionType &&
                prevTx.amount !== currTx.amount) {
                return false;
            }
        }
    }

    return true;
}