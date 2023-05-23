import Fastify from 'fastify';
import { AddressInfo } from 'net';

export async function heartbeatInitializing() {
  const fastify = Fastify({
    logger: false,
  });

  fastify.get('/', async (request, reply) => {
    return reply.send({ status: 'ok' });
  });

  fastify.listen({ port: 4000 }, (err) => {
    if (err) throw err;

    const { port } = fastify.server.address() as AddressInfo;

    console.log(`Server listening on port ${port} 🚀`);
  });
}
