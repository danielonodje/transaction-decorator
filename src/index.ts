import { createServer } from './server.js'
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import transactionsListPlugin from './plugins/transactionsListPlugin.js'
import type { FastifyServerOptions } from 'fastify';
import { Transaction } from './schemas.js';

export function check() {
    return 1;
}

declare module 'fastify' {
    interface FastifyInstance {
        getTransactions: (callExternalAPI?: boolean) => Promise<Transaction[]>
    }
}
export async function start (serverOpts?: FastifyServerOptions) {
    let server = createServer(serverOpts);
    try {
        await server.register(fastifySwagger, {
            openapi: {
                info: {
                    title: 'API Reference',
                    version: '1.0.0'
                }
            }
        });

        await server.register(fastifySwaggerUi, {
            routePrefix: '/api-doc'
        });
        await server.register(transactionsListPlugin);
        await server.ready();
        await server.listen({ port: 3000 });
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
}

start();