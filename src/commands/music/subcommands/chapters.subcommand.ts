import {
  CacheType,
  ChatInputCommandInteraction,
  SlashCommandSubcommandBuilder,
  StringSelectMenuInteraction,
} from 'discord.js';
import play from 'play-dl';

import { ExtendedClient } from '../../../client/ExtendedClient';
import { createMenuReply } from '../../../utils/selectMenuHandler';
import { songObject, stringMenuOption } from '../../../utils';
import { sendThreadEmbed } from '../helpers/embedsHandler';

export const data = (subcommand: SlashCommandSubcommandBuilder) => {
  return subcommand
    .setName('chapters')
    .setDescription('Перемотать трек к определенной главе');
};

export async function execute(
  interaction: ChatInputCommandInteraction<'cached'>,
  client: ExtendedClient
) {
  const guildPlayer = await client.GetGuildPlayer(interaction.guildId);
  if (!guildPlayer) return;

  const { queue, embed } = guildPlayer;
  const songToPlay = queue[0].song;
  const videoData = (await play.video_info(queue[0].song.url)).video_details;

  if (videoData.chapters.length === 0)
    return await client.SendEmbed(
      interaction,
      client.GetErrorEmbed(`❌ У этого ролика нету глав!`)
    );

  const map = videoData.chapters.map((chapter, index) => ({
    label: chapter.title.slice(0, 99),
    description: `⌛: ${chapter.timestamp}`,
    value: index.toString(),
  }));

  await createMenuReply(interaction, map, handleUserChoice);

  async function handleUserChoice(
    choiceDes: stringMenuOption,
    interactionMenu: StringSelectMenuInteraction<CacheType>
  ) {
    if (!guildPlayer) return;

    if (queue[0].song === songToPlay) {
      interactionMenu.update({
        components: [],
        embeds: [
          client.GetSuccessEmbed(`🌿 Переключаемся на главу ${choiceDes.label}`),
        ],
      });

      if (embed.playerThread)
        sendThreadEmbed(interaction, embed.playerThread, {
          description: `⌛ Пользователь переключил трек **${videoData.title}** на главу **${choiceDes.label}**!`,
        });

      queue.splice(1, 0, {
        user: queue[0].user,
        song: {
          type: 'youtube',
          url: queue[0].song.url,
          seek: videoData.chapters[parseInt(choiceDes.value)].seconds,
        },
      } as songObject);

      return guildPlayer.audioPlayer.stop();
    } else {
      return interactionMenu.update({
        components: [],
        embeds: [client.GetErrorEmbed(`❌ Пока вы выбирали, трек был изменен!`)],
      });
    }
  }
}
