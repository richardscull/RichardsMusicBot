import { AudioPlayer, AudioPlayerStatus } from '@discordjs/voice';
import {
  ChatInputCommandInteraction,
  SlashCommandSubcommandBuilder,
} from 'discord.js';
import { ExtendedClient } from '../../../client/ExtendedClient';
import {
  cleanupRemovedSongs,
  errorCodes,
  flushPendingCacheRemovals,
} from '../helpers/tracks.helper';
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
  if (guildPlayer.shuttingDown) return;

  // Set the guild player to shutting down
  guildPlayer.shuttingDown = true;
  const channelId = guildPlayer.voiceConnection.joinConfig.channelId as
    | string
    | undefined;

  // Make bot stop whatever it's doing
  if (guildPlayer.interval) clearInterval(guildPlayer.interval);

  try {
    // Stop the audio player if it's playing
    if (guildPlayer.audioPlayer) guildPlayer.audioPlayer.stop(true);

    // Destroy the voice connection if it exists
    if (guildPlayer.voiceConnection) guildPlayer.voiceConnection.destroy();
  } catch (err) {
    error('Error while stopping the audio player', err);
  }

  await waitForAudioPlayerToStop(guildPlayer.audioPlayer);
  guildPlayer.activeTrackUrl = undefined;
  await cleanupRemovedSongs(guildPlayer, [...guildPlayer.queue], []);
  guildPlayer.queue = [];
  await flushPendingCacheRemovals(guildPlayer);

  const { playerEmbed, playerMessage, playerThread } = guildPlayer.embed;

  // First, delete the thread if it exists
  if (playerThread)
    await playerThread.delete().catch((err) => {
      error("Couldn't delete the player thread", err);
    });

  // Then, update the embed with the reason
  if (playerEmbed) {
    const timePlayed = getDuration((Date.now() - guildPlayer.startTime) / 1000);
    playerEmbed.setDescription(reason + `\n⌚ Время работы: ${timePlayed}`);

    if (playerEmbed.data.footer)
      playerEmbed.data.footer.text = playerEmbed.data.footer.text.split('|')[0];

    if (playerMessage) {
      await playerMessage.edit({ embeds: [playerEmbed] }).catch(async (err) => {
        error("Couldn't edit the player message", err);
        await playerMessage.delete().catch((errNew) => {
          error("Couldn't delete the player message", errNew);
        });
      });
    }
  } else {
    // If the player embed doesn't exist, send the reason to the VC text channel
    const channel = channelId ? await client.channels.fetch(channelId) : null;

    if (channel && channel.isTextBased()) {
      await channel.send({
        embeds: [client.GetErrorEmbed(reason)],
      });
    }
  }

  // Finally, delete the guild player from the cache
  await client.DeleteGuildPlayer(guildPlayer.guildId);
}

async function waitForAudioPlayerToStop(audioPlayer: AudioPlayer) {
  const timeoutAt = Date.now() + 1_000;
  while (
    audioPlayer.state.status !== AudioPlayerStatus.Idle &&
    Date.now() < timeoutAt
  ) {
    await delay(50);
  }

  await delay(100);
}

async function delay(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
