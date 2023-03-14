import {
  ChatInputCommandInteraction,
  SlashCommandSubcommandBuilder,
} from 'discord.js';
import { ExtendedClient } from '../../client/ExtendedClient';
import { guildObject } from '../../utils';

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
  if (guildPlayer) await stopAudioPlayer(interaction, client, guildPlayer);

  return await interaction.editReply({
    embeds: [client.successEmbed(`🌿 Плеер был успешно остановлен!`)],
  });
}

export async function stopAudioPlayer(
  interaction: ChatInputCommandInteraction<'cached'>,
  client: ExtendedClient,
  guildPlayer: guildObject
) {
  if (!guildPlayer) return;

  await client.deleteGuildPlayer(interaction.guildId);

  guildPlayer.queue = [];
  guildPlayer.audioPlayer.stop();
  guildPlayer.voiceConnection.destroy();

  if (!guildPlayer.embed) return;
  const { playerEmbed, playerMessage, playerThread } = guildPlayer.embed;

  if (!playerMessage || !playerThread || !playerEmbed) return;

  if (!playerEmbed.data.footer?.text) return;

  playerEmbed.setDescription(
    `🌧 Плеер остановил ` + interaction.user.toString()
  );

  playerEmbed.data.footer.text = playerEmbed.data.footer.text.split('|')[0];

  await playerMessage.edit({ embeds: [playerEmbed] }).catch(() => {});

  await playerThread.delete();
}
