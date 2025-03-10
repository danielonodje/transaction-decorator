import { Transaction } from '../src/schemas.js';
import { CustomerService } from '../src/plugins/customerService.js';

declare module 'fastify' {
  interface FastifyInstance {
      getTransactions: (callExternalAPI?: boolean) => Promise<Transaction[]>;
      customerService: CustomerService;
  }
}