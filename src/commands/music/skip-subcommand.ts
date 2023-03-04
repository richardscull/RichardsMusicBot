import {
  ChatInputCommandInteraction,
  SlashCommandSubcommandBuilder,
} from 'discord.js';
import { ExtendedClient } from '../../client/ExtendedClient';
import { pluralize } from '../../utils/pluralize';
import { sendThreadEmbed } from './embedsHandler';
import { stopAudioPlayer } from './stop-subcommand';

export const data = (subcommand: SlashCommandSubcommandBuilder) => {
  return subcommand
    .setName('skip')
    .setDescription('Функция пропуска текущего трека в очереди')
    .addIntegerOption((option) =>
      option
        .setName('times')
        .setDescription('Укажите число треков для пропуска')
        .setRequired(false)
    );
};

export async function execute(
  interaction: ChatInputCommandInteraction<'cached'>,
  client: ExtendedClient
) {
  const timesToSkip = interaction.options.getInteger('times');
  const guildPlayer = await client.getGuildPlayer(interaction.guildId);
  if (!guildPlayer) return;

  if (timesToSkip) guildPlayer.queue = guildPlayer.queue.slice(timesToSkip - 1);

  if (guildPlayer.status.onRepeat) {
    guildPlayer.queue.shift();
  }

  const { queue, embed } = guildPlayer;
  if (queue.length < 1) {
    await stopAudioPlayer(interaction, client, guildPlayer);
  } else {
    guildPlayer.status.isPaused = false;
    guildPlayer.audioPlayer.stop(true);
  }

  const getEmbed = client.successEmbed(
    timesToSkip
      ? `✅ ${timesToSkip} треков было пропущен!`
      : `✅ Текущий трек был пропущен!`
  );

  if (embed.playerThread)
    sendThreadEmbed(interaction, embed.playerThread, {
      description: `⏭ Пользователь ${
        timesToSkip
          ? `пропустил **${timesToSkip}** ${pluralize(timesToSkip, 'трек', {
              oneObject: '',
              someObjects: 'а',
              manyObjects: 'ов',
            })}!`
          : `пропустил **текущий** трек!`
      }`,
    });

  return await interaction.editReply({
    embeds: [getEmbed],
  });
}
