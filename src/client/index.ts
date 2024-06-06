import { GatewayIntentBits, Partials } from 'discord.js';
import { ExtendedClient } from './ExtendedClient';
import HandleShutdown from './HandleShutdown';

export const client = new ExtendedClient({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Channel, Partials.Message],
});

async function serverInitializing() {
  await client.DiscordLogin();
  await client.RegisterCustomEmojis();

  process.on('SIGINT', HandleShutdown.bind(null, client));
  process.on('SIGTERM', HandleShutdown.bind(null, client));
  process.on('uncaughtException', (e) => {
    HandleShutdown.bind(null, client, true);
    console.log(e);
  });
  process.on('unhandledRejection', HandleShutdown.bind(null, client, true));
}

serverInitializing();
