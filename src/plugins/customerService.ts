import { FastifyBaseLogger, FastifyInstance } from 'fastify';
import { Transaction, TransactionChain, CustomerTransactions, TransactionCustomerRelationship, CustomerRelationships, TransactionTimeLineEntry } from '../schemas.js'
import { validateTransactionAmount } from '../utils/transactionFeeValidation.js';
import { validateTransactionStatusTransition } from '../utils/transactionStatusValidation.js';
import fp from 'fastify-plugin';

export class CustomerService {
  private customerTransactions: Map<number, TransactionChain[]>;
  private customerRelationships: Map<number, TransactionCustomerRelationship[]>;
  private logger: FastifyBaseLogger;
  private transactionMapById: Map<number, Transaction>;

  constructor(transactions: Transaction[], logger: FastifyBaseLogger) {
    this.logger = logger;
    this.transactionMapById = this.createTransactionMap(transactions);
    this.customerRelationships = this.buildCustomerRelationships(transactions);
    this.customerTransactions = this.buildCustomerTransactions(transactions);
  }

  private createTransactionMap(transactions: Transaction[]): Map<number, Transaction> {
    const transactionsByTransactionId = new Map<number, Transaction>();

    for (const tx of transactions) {
      transactionsByTransactionId.set(tx.transactionId, tx);
    }

    return transactionsByTransactionId;
  }

  getCustomerTransactions(customerId: number): CustomerTransactions {
    return { transactions: this.customerTransactions.get(customerId) ?? [] };
  }

  getCustomerRelationships(customerId: number): CustomerRelationships {
    return { relatedCustomers: this.customerRelationships.get(customerId) ?? [] };
  }

  hasCustomer(customerId: number): boolean {
    return this.customerTransactions.has(customerId);
  }

  private buildCustomerTransactions(transactions: Transaction[]): Map<number, TransactionChain[]> {
    this.logger.info("Building Customer Transactions Graph");

    const customerTxs = new Map<number, TransactionChain[]>();
    const txByCustomerAndAuthCode = new Map<string, { customerId: number; txs: Transaction[] }>();

    for (const tx of transactions) {
      let key =  `${tx.customerId}-${tx.authorizationCode}`;
      // add FEE transactions to the parent's transaction group
      if(tx.transactionType === 'FEE' && tx.metadata.relatedTransactionId) {
        const parentTx = this.transactionMapById.get(tx.metadata.relatedTransactionId);
        if(parentTx) {
          key = `${parentTx.customerId}-${parentTx.authorizationCode}`;
        }
      }

      if (!txByCustomerAndAuthCode.has(key)) {
        txByCustomerAndAuthCode.set(key, { customerId: tx.customerId, txs: [] });
      }
      txByCustomerAndAuthCode.get(key)!.txs.push(tx);
    }

    for (const [, txGroup] of txByCustomerAndAuthCode.entries()) {
      const customerId = txGroup.customerId;

      // Sort transactions chronologically (ascending)
      const chronologicalTxs = [...txGroup.txs].sort((a, b) => {
        const dateA = new Date(a.transactionDate).getTime() || 0;
        const dateB = new Date(b.transactionDate).getTime() || 0;
        return dateA - dateB;
      });

      if (chronologicalTxs.length === 0) continue;
      const firstTx = chronologicalTxs[0];
      const lastTx = chronologicalTxs[chronologicalTxs.length - 1];

      // Build timeline (sorted in descending order for display)
      const timeline: TransactionTimeLineEntry[] = chronologicalTxs.reverse().map(tx => ({
        createdAt: tx.transactionDate,
        status: tx.transactionStatus,
        amount: tx.amount,
      }));

      const transactionChain: TransactionChain = {
        createdAt: firstTx.transactionDate,
        updatedAt: lastTx.transactionDate,
        transactionId: firstTx.transactionId,
        authorizationCode: firstTx.authorizationCode,
        status: lastTx.transactionStatus,
        description: firstTx.description,
        transactionType: firstTx.transactionType,
        metadata: { ...lastTx.metadata },
        timeline,
      };

      if (!customerTxs.has(customerId)) customerTxs.set(customerId, []);
        customerTxs.get(customerId)!.push(transactionChain);

      /**
       * I'd originally had an idea to validate the transaction chains by making sure the amounts and the status transitions valid
       * are validl. Ultimately decided to not do that because the test data wasn't designed with this in mind.
       * I'm leaving the validation code so you can take a look but I'll not be filtering out invalid transactions and
       *  will just build the chain from the data as is.
       */
      // if (this.isValidTransactionChain(chronologicalTxs)) {
      //   if (!customerTxs.has(customerId)) customerTxs.set(customerId, []);
      //   customerTxs.get(customerId)!.push(transactionChain);
      // } else {
      //   this.logger.warn(transactionChain, `Invalid transaction chain detected for customer ${customerId}, auth code ${firstTx.authorizationCode}`);
      // }
    }

    this.logger.info(`Customer Transactions Graph complete. ${customerTxs.size} customers found`);

    return customerTxs;
  }


  private isValidTransactionChain(transactions: Transaction[]): boolean {
    return validateTransactionStatusTransition(transactions) && validateTransactionAmount(transactions);
  }

  private buildCustomerRelationships(
    transactions: Transaction[]
  ): Map<number, TransactionCustomerRelationship[]> {
    this.logger.info("Building Customer Relationships Graph");

    const relationshipsByCustomerId = new Map<number, TransactionCustomerRelationship[]>();
    const devicesByCustomerId = new Map<string, Set<number>>();

    // Track added relationships to avoid duplicates
    const addedRelationships = new Set<string>();

    // First Pass: Build Transaction, DeviceId, and Relationship Maps
    for (const tx of transactions) {
      if (!relationshipsByCustomerId.has(tx.customerId)) relationshipsByCustomerId.set(tx.customerId, []);
      if (tx.metadata?.deviceId) {
        if (!devicesByCustomerId.has(tx.metadata.deviceId)) devicesByCustomerId.set(tx.metadata.deviceId, new Set<number>());
        devicesByCustomerId.get(tx.metadata.deviceId)?.add(tx.customerId);
      }
    }

    // Second Pass: Process P2P transactions
    for (const tx of transactions) {
      if (tx.transactionType === "P2P_SEND" && tx.metadata?.relatedTransactionId) {
        const receiverTx = this.transactionMapById.get(tx.metadata.relatedTransactionId);
        if (receiverTx && receiverTx.transactionType === "P2P_RECEIVE") {
          const senderId = tx.customerId;
          const receiverId = receiverTx.customerId;

          const key1 = `${senderId}-${receiverId}-P2P_SEND`;
          const key2 = `${receiverId}-${senderId}-P2P_RECEIVE`;

          if (!addedRelationships.has(key1)) {
            relationshipsByCustomerId.get(senderId)?.push({
              relatedCustomerId: receiverId,
              relationType: "P2P_SEND"
            });
            addedRelationships.add(key1);
          }

          if (!addedRelationships.has(key2)) {
            relationshipsByCustomerId.get(receiverId)?.push({
              relatedCustomerId: senderId,
              relationType: "P2P_RECEIVE"
            });
            addedRelationships.add(key2);
          }
        }
      }
    }

    // Create Relationships for shared devices
    for (const [, customers] of devicesByCustomerId.entries()) {
      if (customers.size <= 1) continue; // Skip devices used by only one customer

      const customerArray = Array.from(customers);
      for (let i = 0; i < customerArray.length; i++) {
        for (let j = i + 1; j < customerArray.length; j++) {
          const customer1 = customerArray[i];
          const customer2 = customerArray[j];

          const key1 = `${customer1}-${customer2}-DEVICE`;
          const key2 = `${customer2}-${customer1}-DEVICE`;

          if (!addedRelationships.has(key1) && !addedRelationships.has(key2)) {
            relationshipsByCustomerId.get(customer1)?.push({
              relatedCustomerId: customer2,
              relationType: "DEVICE"
            });
            relationshipsByCustomerId.get(customer2)?.push({
              relatedCustomerId: customer1,
              relationType: "DEVICE"
            });

            addedRelationships.add(key1);
            addedRelationships.add(key2);
          }
        }
      }
    }

    return relationshipsByCustomerId;
  }
}

async function customerService(fastify: FastifyInstance) {
  fastify.addHook('onReady', async () => {
    fastify.log.info('Fetching Transaction Information');
    let transactions: Transaction[] = [];
    try {
      transactions = await fastify.getTransactions();
      fastify.log.info(`Fetched ${transactions.length} transactions.`);
    } catch (err) {
      fastify.log.error('Failed to fetch transactions', err);
    }
    
    const service = new CustomerService(transactions, fastify.log);

    fastify.decorate('customerService', service);
  });
}

export default fp(customerService);