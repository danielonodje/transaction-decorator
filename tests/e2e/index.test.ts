import { FastifyInstance } from 'fastify';
import { createServer } from '../../src/server.js';
import { test, expect, describe, beforeAll, afterAll } from 'vitest';

describe('Hello World API endpoint', () => {
    let server: FastifyInstance;
    beforeAll(async () => {
        server = createServer({});
        await server.ready();
    });

    afterAll(() => {
        server.close();
    })


    test('hello world endpoint returns 200 with correct content', async () => {
        const response = await server.inject({
            method: 'GET',
            url: '/'
        });

        expect(response.statusCode).toBe(200);
        expect(response.body).toBe('Hello world!');
    });
});