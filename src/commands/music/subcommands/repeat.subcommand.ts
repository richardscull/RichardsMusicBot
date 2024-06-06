import {
  ChatInputCommandInteraction,
  SlashCommandSubcommandBuilder,
} from 'discord.js';
import { ExtendedClient } from '../../../client/ExtendedClient';
import { SendThreadEmbed } from '../helpers/embeds.helper';

export const data = (subcommand: SlashCommandSubcommandBuilder) => {
  return subcommand
    .setName('repeat')
    .setDescription('Функция зацикливания трека');
};

export async function execute(
  interaction: ChatInputCommandInteraction<'cached'>,
  client: ExtendedClient
) {
  const guildPlayer = await client.GetGuildPlayer(interaction.guildId);
  if (!guildPlayer) return;

  const { status, embed } = guildPlayer;
  status.onRepeat = status.onRepeat ? false : true;

  const getEmbed = client.GetSuccessEmbed(
    `🌿 Функция зацикливания ${status.onRepeat ? 'включена!' : 'выключена!'}`
  );

  if (embed.playerThread)
    SendThreadEmbed(interaction, embed.playerThread, {
      description: `🔁 Пользователь **${
        status.onRepeat ? 'включил' : 'выключил'
      }** функцию зацикливания!`,
    }).catch(() => {});

  return await interaction.editReply({
    embeds: [getEmbed],
  });
}
