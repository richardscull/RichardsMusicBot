import chalk from 'chalk';
import { ActivityType, Client, Events } from 'discord.js';

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client: Client) {
    console.log(
      chalk.green(`\n✅ Ready! Logged in as `) +
        chalk.green.bold(client.user?.tag)
    );
    client.user?.setPresence({
      activities: [{ type: ActivityType.Listening, name: ' музыку 24/7 🎶' }],
      status: 'online',
    });
  },
};
