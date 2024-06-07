import { Events, Message, StageChannel } from 'discord.js';
import { client } from '../client/index';

module.exports = {
  name: Events.MessageDelete,
  async execute(Message: Message) {
    const isCreatedByBot = Message.author?.id === Message.client.user.id;
    if (isCreatedByBot) await checkIfPlayerMessage(Message as Message<true>);
  },
};

async function checkIfPlayerMessage(Message: Message<true>) {
  const guildPlayer = await client.GetGuildPlayer(Message.guildId);
  const isDeletedMessageWasPlayerMessage =
    guildPlayer?.embed.playerMessage === Message;

  if (!guildPlayer || !isDeletedMessageWasPlayerMessage) return;

  const { thread: deletedMessageThread } = Message;
  if (Message.channel instanceof StageChannel) return;
  if (!guildPlayer.embed.playerEmbed) return;

  if (guildPlayer.shuttingDown) return;

  guildPlayer.embed.playerMessage = await Message.channel.send({
    embeds: [guildPlayer.embed.playerEmbed],
  });

  guildPlayer.embed.playerThread =
    await guildPlayer.embed.playerMessage.startThread({
      name: '🔊 Музыкальный плеер',
    });

  await deletedMessageThread?.delete();
}
