import Fastify, { FastifyInstance, FastifyServerOptions } from 'fastify';

export function createServer(opts: FastifyServerOptions ) {
    const server = Fastify({
        logger: true,
        ...opts
    });

    server.get('/', () => {
        return 'Hello world!';
    });

    return server;
}
