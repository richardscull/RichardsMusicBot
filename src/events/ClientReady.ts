import { ActivityType, Client, Events } from 'discord.js';
import log from '../utils/logger';

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client: Client) {
    log('🐬 Ready! Logged in as ' + client.user?.tag);

    client.user?.setPresence({
      activities: [{ type: ActivityType.Listening, name: ' музыку 24/7 🍃' }],
      status: 'online',
    });
  },
};
