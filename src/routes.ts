import { FastifyInstance } from "fastify";
import { TransactionChainJsonSchema, CustomerRelationshipJsonSchema } from "./schemas.js";

async function routes(fastify: FastifyInstance) {
    fastify.get('/', {
        schema: {
            description: "Hello World",
            response: {
                200: {
                    description: "Success"
                },
                default: {
                    description: "Failed"
                }
            }
        }
    }, () => 'Hello world!');

    fastify.get<{ Params: { customerId: number } }>('/customers/:customerId/transactions', {
        schema: {
            params: {
                type: 'object',
                properties: {
                    customerId: { type: 'number' }
                },
                required: ['customerId']
            },
            response: {
                200: TransactionChainJsonSchema,
                404: {
                    description: "Not Found"
                }
            }
        }
    }, (request, reply) => {
        const { customerId } = request.params;

        if (!fastify.customerService.hasCustomer(customerId)) return reply.status(404).send();

        const transactions = fastify.customerService.getCustomerTransactions(customerId);
        return reply.status(200).send(transactions);
    });

    fastify.get<{ Params: { customerId: number } }>('/customers/:customerId/relationships', {
        schema: {
            params: {
                type: 'object',
                properties: {
                    customerId: { type: 'number' }
                },
                required: ['customerId']
            },
            response: {
                200: CustomerRelationshipJsonSchema,
                404: {
                    description: "Not Found"
                }
            }
        }
    }, (request, reply) => {
        const { customerId } = request.params;

        if (!fastify.customerService.hasCustomer(customerId)) return reply.status(404).send();

        const relationships = fastify.customerService.getCustomerRelationships(customerId);
        return reply.status(200).send(relationships);
    });
}

export default routes;