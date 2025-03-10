import { FastifyInstance } from 'fastify';
import data from '../../transactions-v2.1.json' with { type: 'json' };
import { Transaction, TransactionSchema } from '../schemas.js';
import fp from 'fastify-plugin';

const TRANSACTIONS_URL = "https://cdn.seen.com/challenge/transactions-v2.1.json";

async function transactionsList(fastify: FastifyInstance) {
    fastify.decorate('getTransactions', async function getTransactions(callExternalAPI = true): Promise<Transaction[]> {
        const transactionData = await getTransactionsExternal(callExternalAPI);
    
        return validateTransactions(transactionData);
    })
    
    function validateTransactions(transactionData: unknown): Transaction[] {
        const output: Transaction[] = [];
    
        if (!Array.isArray(transactionData)) return output;
    
        for (const transaction of transactionData) {
            const validationResult = TransactionSchema.safeParse(transaction);
            if (validationResult.success) {
                output.push(transaction as Transaction);
            } else {
                fastify.log.warn(validationResult.error, 'Transction failed validation');
            }
        }

        return output;
    }
    
    async function getTransactionsExternal(callExternalAPI: boolean): Promise<unknown> {
        if (!callExternalAPI) return data;
        try {
            const response = await fetch(TRANSACTIONS_URL);
            const contentType = response.headers.get('content-type');
            if (response && response.ok && contentType?.includes('application/json')) {
                return response.json();
            }
            fastify.log.warn(`Unexpected response from ${TRANSACTIONS_URL}: ${response.status} ${response.statusText}. Falling back to local data`);
            return data;
        } catch (err) {
            fastify.log.warn(err, `Failed to fetch transactions at: ${TRANSACTIONS_URL}. Falling back to local data`);
            return data;
        }
    }
}

export default fp(transactionsList);

