import Fastify, { FastifyServerOptions } from 'fastify';

export function createServer(enableLogging = true, serverOpts?: FastifyServerOptions) {
    const server = Fastify({
        logger: enableLogging,
        ...serverOpts
    });

    return server;
}
