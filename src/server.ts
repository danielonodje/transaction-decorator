import Fastify, { FastifyServerOptions } from 'fastify';

export function createServer(opts?: FastifyServerOptions) {
    const server = Fastify({
        logger: true,
        ...opts
    });

    server.get('/', {
        schema: {
            description: "Hello Word route",
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

    return server;
}
