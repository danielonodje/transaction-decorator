import { Transaction } from './schemas.js';
import { CustomerService } from './services/customerService.js';

declare module 'fastify' {
  interface FastifyInstance {
      getTransactions: (callExternalAPI?: boolean) => Promise<Transaction[]>;
      customerService: CustomerService;
  }
}