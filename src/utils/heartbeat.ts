import Fastify from 'fastify';
import { AddressInfo } from 'net';
import log from './logger';

/* 
    Note: Heartbeat is a feature to check
    status of this bot. But if you are not
    planning to use it, you can safely delete it.
*/

export default async function HeartbeatInitializing() {
  const fastify = Fastify({
    logger: false,
  });

  fastify.get('/', async (_, reply) => {
    return reply.send({ status: 'ok' });
  });

  // Change the port if you want to.
  fastify.listen({ port: 4000 }, (err) => {
    if (err) throw err;

    const { port } = fastify.server.address() as AddressInfo;

    log(`✅ Hearbeat listening on port ${port} 🚀`);
  });
}
