import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import data from '../../transactions-v2.1.json' with { type: 'json' };
import { Transaction, TransactionSchema } from '../schemas.js';
import fp from 'fastify-plugin';

const TRANSACTIONS_URL = "https://cdn.seen.com/challenge/transactions-v2.1.json";

async function transactionsList(fastify: FastifyInstance, options: FastifyPluginOptions) {
    fastify.decorate('getTransactions', async function getTransactions(callExternalAPI = false): Promise<Transaction[]> {
        const transactionData = callExternalAPI ? await getTransactionsExternal() : data;
    
        return validateTransactions(transactionData);
    })
    
    function validateTransactions(transactionData: any): Transaction[] {
        const output: Transaction[] = [];
    
        if (!Array.isArray(transactionData)) return output;
    
        for (let transaction of transactionData) {
            let validationResult = TransactionSchema.safeParse(transaction);
            if (validationResult.success) {
                output.push(transaction as Transaction);
            } else {
                fastify.log.warn(validationResult.error, 'Transction failed validation');
            }
        }

        return output;
    }
    
    async function getTransactionsExternal(): Promise<any> {
        try {
            const response = await fetch(TRANSACTIONS_URL);
            const contentType = response.headers.get('content-type');
            if (response && response.ok && contentType?.includes('application/json')) {
                return response.json();
            }
            fastify.log.warn(`Unexpected response from ${TRANSACTIONS_URL}: ${response.status} ${response.statusText}`);
            return [];
        } catch (err) {
            fastify.log.warn(err, `Failed to fetch transactions at: ${TRANSACTIONS_URL}`);
            return [];
        }
    }
}
const transactionsListPlugin = fp(transactionsList);

export default transactionsListPlugin;

