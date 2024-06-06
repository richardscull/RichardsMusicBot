import {
  ChatInputCommandInteraction,
  SlashCommandSubcommandBuilder,
} from 'discord.js';
import { ExtendedClient } from '../../../client/ExtendedClient';
import { stopAudioPlayer } from './stop.subcommand';
import Pluralize from '../../../utils/textConversion/pluralize';
import { SendThreadEmbed } from '../helpers/embeds.helper';

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
  const guildPlayer = await client.GetGuildPlayer(interaction.guildId);
  if (!guildPlayer) return;

  if (timesToSkip) guildPlayer.queue = guildPlayer.queue.slice(timesToSkip - 1);

  const { queue, embed } = guildPlayer;

  if (queue.length <= 1) {
    const reason = `🌿 Плеер остановил ${interaction.user.toString()}`;
    await stopAudioPlayer(reason, { client, guildPlayer });
  } else {
    guildPlayer.status.isPaused = false;

    // If the player is on repeat, remove the first track from the queue
    // Because on repeat player doesnt skips the current track
    if (guildPlayer.status.onRepeat) {
      guildPlayer.queue.shift();
    }

    guildPlayer.audioPlayer.stop(true);
  }

  const getEmbed = client.GetSuccessEmbed(
    timesToSkip
      ? `✅ ${timesToSkip} ${Pluralize(timesToSkip, '', {
          oneObject: 'трек был пропущен',
          someObjects: 'трека было пропущено',
          manyObjects: 'треков было пропущено',
        })}!`
      : `✅ Текущий трек был пропущен!`
  );

  if (embed.playerThread)
    await SendThreadEmbed(interaction, embed.playerThread, {
      description: `⏭ Пользователь ${
        timesToSkip
          ? `пропустил **${timesToSkip}** ${Pluralize(timesToSkip, 'трек', {
              oneObject: '',
              someObjects: 'а',
              manyObjects: 'ов',
            })}!`
          : `пропустил **текущий** трек!`
      }`,
    }).catch(() => {});

  return await interaction.editReply({
    embeds: [getEmbed],
  });
}
