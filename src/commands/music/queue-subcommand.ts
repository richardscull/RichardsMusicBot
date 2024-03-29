import {
  ChatInputCommandInteraction,
  SlashCommandSubcommandBuilder,
} from 'discord.js';

import { ExtendedClient } from '../../client/ExtendedClient';

import { createListEmbed } from '../../utils/embedListPagination';

export const data = (subcommand: SlashCommandSubcommandBuilder) => {
  return subcommand
    .setName('queue')
    .setDescription('Функция просмотра очереди треков');
};

export async function execute(
  interaction: ChatInputCommandInteraction<'cached'>,
  client: ExtendedClient
) {
  const guildPlayer = await client.getGuildPlayer(interaction.guildId);
  if (!guildPlayer) return;

  const { queue } = guildPlayer;

  await interaction.editReply({
    embeds: [
      client.successEmbed('⌛ Пожалуйста, подождите, идет загрузка трека...'),
    ],
  });

  return await createListEmbed(interaction, queue);
}
