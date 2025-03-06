import { createServer } from './server.js'

export function check() {
    return 1;
}

export async function start () {
    let server = createServer({});
    try {
        await server.listen({ port: 3000});
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
}

start();