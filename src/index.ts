import { createServer } from './server.js'
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import transactionsListPlugin from './plugins/transactionsListPlugin.js'
import customerServicePlugin from './plugins/customerService.js';
import routesPlugin from './routes.js';
import { FastifyServerOptions } from 'fastify';


export async function start (enableLogging = true, serverOpts?: FastifyServerOptions) {
    const server = createServer(enableLogging, serverOpts);
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
            routePrefix: '/docs'
        });

        await server.register(transactionsListPlugin);
        await server.register(customerServicePlugin);
        await server.register(routesPlugin);
        await server.ready();
        await server.listen({ port: 3000 });
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
}

start();