import {
  ChatInputCommandInteraction,
  SlashCommandSubcommandBuilder,
} from 'discord.js';

import { ExtendedClient } from '../../../client/ExtendedClient';
import CreateListEmbed from '../../../utils/embeds/embedListPagination';

export const data = (subcommand: SlashCommandSubcommandBuilder) => {
  return subcommand
    .setName('queue')
    .setDescription('Функция просмотра очереди треков');
};

export async function execute(
  interaction: ChatInputCommandInteraction<'cached'>,
  client: ExtendedClient
) {
  const guildPlayer = await client.GetGuildPlayer(interaction.guildId);
  if (!guildPlayer) return;

  const { queue } = guildPlayer;

  await interaction.editReply({
    embeds: [
      client.GetSuccessEmbed(
        '⌛ Пожалуйста, подождите, идет загрузка списка треков...'
      ),
    ],
  });

  return await CreateListEmbed(interaction, queue);
}
