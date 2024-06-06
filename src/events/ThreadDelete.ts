import { Events, ThreadChannel } from 'discord.js';
import { client } from '../client/index';

module.exports = {
  name: Events.ThreadDelete,
  async execute(Thread: ThreadChannel) {
    const isCreatedByBot = Thread.ownerId === Thread.client.user.id;
    if (isCreatedByBot) await recreatePlayerThread(Thread);
  },
};

async function recreatePlayerThread(Thread: ThreadChannel) {
  const currentGuildPlayer = await client.GetGuildPlayer(Thread.guildId);
  const isDeletedThreadWasPlayerThread =
    currentGuildPlayer?.embed.playerThread === Thread;

  if (!currentGuildPlayer || !isDeletedThreadWasPlayerThread) return;
  if (!currentGuildPlayer.embed.playerMessage) return;

  currentGuildPlayer.embed.playerThread =
    await currentGuildPlayer.embed.playerMessage.startThread({
      name: '🔊 Музыкальный плеер',
    });
}
