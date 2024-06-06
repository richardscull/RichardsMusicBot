import {
  ChatInputCommandInteraction,
  SlashCommandSubcommandBuilder,
} from 'discord.js';
import { ExtendedClient } from '../../../client/ExtendedClient';
import { pluralize } from '../../../utils/pluralize';
import { sendThreadEmbed } from '../helpers/embedsHandler';
import { stopAudioPlayer } from './stop.subcommand';

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

  if (guildPlayer.status.onRepeat) {
    guildPlayer.queue.shift();
  }

  const { queue, embed } = guildPlayer;

  if (queue.length <= 1) {
    const reason = `🌿 Плеер остановил ${interaction.user.toString()}`;
    await stopAudioPlayer(reason, { client, guildPlayer });
  } else {
    guildPlayer.status.isPaused = false;
    guildPlayer.audioPlayer.stop(true);
  }

  const getEmbed = client.GetSuccessEmbed(
    timesToSkip
      ? `✅ ${timesToSkip} ${pluralize(timesToSkip, '', {
          oneObject: 'трек был пропущен',
          someObjects: 'трека было пропущено',
          manyObjects: 'треков было пропущено',
        })}!`
      : `✅ Текущий трек был пропущен!`
  );

  if (embed.playerThread && queue.length > 1)
    await sendThreadEmbed(interaction, embed.playerThread, {
      description: `⏭ Пользователь ${
        timesToSkip
          ? `пропустил **${timesToSkip}** ${pluralize(timesToSkip, 'трек', {
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
