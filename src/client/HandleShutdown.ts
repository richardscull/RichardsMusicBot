import { stopAudioPlayer } from '../commands/music/subcommands/stop.subcommand';
import log from '../utils/logger';
import { ExtendedClient } from './ExtendedClient';

export default async function HandleShutdown(
  client: ExtendedClient,
  isUnexpected = false
) {
  if (isUnexpected) {
    log('Unexpected error occurred, shutting down...');
  } else {
    log('Shutting down...');
  }

  // Stop all audio players
  const stopPromises = Array.from(client.MusicPlayer.values()).map(
    async (player) => {
      const reason = `🌿 Плеер остановился из-за выключения бота`;
      return stopAudioPlayer(reason, { client, guildPlayer: player });
    }
  );

  // Wait for all audio players to stop
  await Promise.all(stopPromises);

  // Destroy the client
  await client.destroy();
  process.exit(0);
}
