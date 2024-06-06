import {
  ChatInputCommandInteraction,
  SlashCommandSubcommandBuilder,
} from 'discord.js';
import { ExtendedClient } from '../../../client/ExtendedClient';
import { errorCodes } from '../helpers/tracks.helper';
import { PlayerProps } from '../../../types';
import { getDuration } from '../../../utils/textConversion/getDuration';
import { error } from '../../../utils/logger';

export const data = (subcommand: SlashCommandSubcommandBuilder) => {
  return subcommand
    .setName('stop')
    .setDescription('Закончить проигрывать музыку');
};

export async function execute(
  interaction: ChatInputCommandInteraction<'cached'>,
  client: ExtendedClient
) {
  const guildPlayer = await client.GetGuildPlayer(interaction.guildId);

  const reason = `🌿 Плеер остановил ${interaction.user.toString()}`;

  if (guildPlayer) await stopAudioPlayer(reason, { client, guildPlayer });

  return await interaction.editReply({
    embeds: [client.GetSuccessEmbed(`🌿 Плеер был успешно остановлен!`)],
  });
}

export async function stopAudioPlayer(
  reason: string | errorCodes,
  props: PlayerProps
) {
  const { client, guildPlayer } = props;

  const timePlayed = getDuration((Date.now() - guildPlayer.startTime) / 1000);

  await client.DeleteGuildPlayer(guildPlayer.guildId);

  if (guildPlayer.interval) clearInterval(guildPlayer.interval);

  if (guildPlayer.voiceConnection) guildPlayer.voiceConnection.destroy();

  if (guildPlayer.audioPlayer) guildPlayer.audioPlayer.stop(true);

  const { playerEmbed, playerMessage, playerThread } = guildPlayer.embed;

  if (playerEmbed)
    playerEmbed.setDescription(reason + `\n⌚ Время работы: ${timePlayed}`);

  if (playerEmbed && playerEmbed.data.footer)
    playerEmbed.data.footer.text = playerEmbed.data.footer.text.split('|')[0];

  if (playerMessage && playerEmbed)
    await playerMessage.edit({ embeds: [playerEmbed] }).catch(() => {
      playerMessage.delete().catch((err) => {
        error(err);
      });
    });

  if (playerThread) await playerThread.delete();
}
