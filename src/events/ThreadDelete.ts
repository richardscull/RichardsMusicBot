import { Events, ThreadChannel } from 'discord.js';
import { client } from '../client/index';

module.exports = {
  name: Events.ThreadDelete,
  async execute(Thread: ThreadChannel) {
    if (Thread.ownerId === Thread.client.user.id)
      await checkIfPlayerThread(Thread);
  },
};

async function checkIfPlayerThread(Thread: ThreadChannel) {
  const guildPlayer = await client.getGuildPlayer(Thread.guildId);
  if (guildPlayer && guildPlayer.embed.playerThread === Thread) {
    if (guildPlayer.embed.playerMessage)
      guildPlayer.embed.playerThread =
        await guildPlayer.embed.playerMessage.startThread({
          name: '🔊 Музыкальный плеер',
        });
  }
}
