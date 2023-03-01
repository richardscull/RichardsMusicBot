import { Events, Message } from 'discord.js';
import { client } from '../client/index';

module.exports = {
  name: Events.MessageDelete,
  async execute(Message: Message) {
    if (Message.author?.id === Message.client.user.id)
      await checkIfPlayerMessage(Message as Message<true>);
  },
};

async function checkIfPlayerMessage(Message: Message<true>) {
  const guildPlayer = await client.getGuildPlayer(Message.guildId);
  if (guildPlayer && guildPlayer.embed.playerMessage === Message) {
    const { thread: deletedMessageThread } = Message;

    if (guildPlayer.embed.playerEmbed)
      guildPlayer.embed.playerMessage = await Message.channel.send({
        embeds: [guildPlayer.embed.playerEmbed],
      });

    guildPlayer.embed.playerThread =
      await guildPlayer.embed.playerMessage.startThread({
        name: '🔊 Музыкальный плеер',
      });

    await deletedMessageThread?.delete();
  }
}
