import {
  ChatInputCommandInteraction,
  SlashCommandSubcommandBuilder,
} from 'discord.js';
import { ExtendedClient } from '../../client/ExtendedClient';
import { PlayerProps } from '../../utils';
import { errorCodes } from './play-utils';

export const data = (subcommand: SlashCommandSubcommandBuilder) => {
  return subcommand
    .setName('stop')
    .setDescription('Закончить проигрывать музыку');
};

export async function execute(
  interaction: ChatInputCommandInteraction<'cached'>,
  client: ExtendedClient
) {
  const guildPlayer = await client.getGuildPlayer(interaction.guildId);

  const reason = `🌿 Плеер остановил ${interaction.user.toString()}`;

  if (guildPlayer) await stopAudioPlayer(reason, { client, guildPlayer });

  return await interaction.editReply({
    embeds: [client.successEmbed(`🌿 Плеер был успешно остановлен!`)],
  });
}

export async function stopAudioPlayer(
  reason: string | errorCodes,
  props: PlayerProps
) {
  const { client, guildPlayer } = props;

  await client.deleteGuildPlayer(guildPlayer.guildId);

  if (guildPlayer.interval) clearInterval(guildPlayer.interval);

  if (guildPlayer.voiceConnection) guildPlayer.voiceConnection.destroy();

  const { playerEmbed, playerMessage, playerThread } = guildPlayer.embed;

  if (playerEmbed) playerEmbed.setDescription(reason);

  if (playerEmbed && playerEmbed.data.footer)
    playerEmbed.data.footer.text = playerEmbed.data.footer.text.split('|')[0];

  if (playerMessage && playerEmbed)
    await playerMessage.edit({ embeds: [playerEmbed] }).catch(() => {});

  if (playerThread) await playerThread.delete();
}
