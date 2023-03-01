import {
  ChatInputCommandInteraction,
  SlashCommandSubcommandBuilder,
} from 'discord.js';
import { ExtendedClient } from '../../client/ExtendedClient';
import { sendThreadEmbed } from './embedsHandler';

export const data = (subcommand: SlashCommandSubcommandBuilder) => {
  return subcommand
    .setName('repeat')
    .setDescription('Функция зацикливания трека');
};

export async function execute(
  interaction: ChatInputCommandInteraction<'cached'>,
  client: ExtendedClient
) {
  const guildPlayer = await client.getGuildPlayer(interaction.guildId);
  if (!guildPlayer) return;

  const { status, embed } = guildPlayer;
  status.onRepeat = status.onRepeat ? false : true;

  const getEmbed = client.successEmbed(
    `🌿 Функция зацикливания ${status.onRepeat ? 'включена!' : 'выключена!'}`
  );

  if (embed.playerThread)
    sendThreadEmbed(interaction, embed.playerThread, {
      description: `🔁 Пользователь **${
        status.onRepeat ? 'включил' : 'выключил'
      }** функцию зацикливания!`,
    });

  return await interaction.editReply({
    embeds: [getEmbed],
  });
}
