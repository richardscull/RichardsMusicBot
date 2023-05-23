import chalk from 'chalk';
import Fastify from 'fastify';
import { AddressInfo } from 'net';

/* 
    Note: Heartbeat is a feature to check
    status of this bot. But if you are not
    planning to use it, you can safely delete it.*/

export async function heartbeatInitializing() {
  const fastify = Fastify({
    logger: false,
  });

  fastify.get('/', async (request, reply) => {
    return reply.send({ status: 'ok' });
  });

  //Change the port if you want to.
  fastify.listen({ port: 4000 }, (err) => {
    if (err) throw err;

    const { port } = fastify.server.address() as AddressInfo;

    console.log(chalk.green(`✅ Hearbeat listening on port ${port} 🚀`));
  });
}
