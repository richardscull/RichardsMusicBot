import {
  errorCodes,
  firstObjectToAudioResource,
  getPlaylistTitle,
  getVideoTitle,
  isForcedInput,
  pushSong,
  spliceSong,
  validateInput,
} from './play-utils';
import {
  ChatInputCommandInteraction,
  SlashCommandSubcommandBuilder,
  VoiceChannel,
} from 'discord.js';
import { ExtendedClient } from '../../client/ExtendedClient';
import { createGuildPlayer } from './play-guildPlayer';
import { sendThreadEmbed } from './embedsHandler';

export const data = (subcommand: SlashCommandSubcommandBuilder) => {
  return subcommand
    .setName('play')
    .setDescription('Начать проигрывать музыку')
    .addStringOption((option) =>
      option
        .setName('track')
        .setDescription('Введите название музыки или URL (Youtube, Spotify)')
        .setRequired(true)
    )
    .addBooleanOption((option) =>
      option
        .setName('force')
        .setDescription('Запустить ли трек сразу?')
        .setRequired(false)
    );
};

export async function execute(
  interaction: ChatInputCommandInteraction<'cached'>,
  client: ExtendedClient
) {
  const userInput = interaction.options.getString('track', true);
  const userInputData = await validateInput(userInput, interaction);
  const isSongsArray = Array.isArray(userInputData);

  if (typeof userInputData === 'string') {
    return await interaction.editReply({
      embeds: [client.errorEmbed(userInputData)],
    });
  } else if (typeof userInputData === 'undefined') {
    return await interaction.editReply({
      embeds: [client.errorEmbed(errorCodes.no_result)],
    });
  }

  const guildPlayer = (await client.getGuildPlayer(interaction.guildId))
    ? await client.getGuildPlayer(interaction.guildId)
    : await createGuildPlayer(interaction, client);

  if (!guildPlayer) return;

  const hasEmptyQueue = guildPlayer.queue.length == 0;

  if (isSongsArray) {
    for (let i = 0; i < userInputData.length; i++) {
      pushSong(guildPlayer, userInputData[i]);
    }
  } else {
    if (isForcedInput(interaction)) {
      spliceSong(guildPlayer, userInputData);
    } else {
      pushSong(guildPlayer, userInputData);
    }
  }

  if (!guildPlayer.voiceConnection.joinConfig.channelId) return;

  const voiceChannel = client.channels.cache.get(
    guildPlayer.voiceConnection.joinConfig.channelId
  ) as VoiceChannel;

  const { playerMessage, playerThread, playerEmbed } = guildPlayer.embed;

  // If bot is not in voice channel and queue is empty, stop the player
  if (!voiceChannel.members.get(interaction.client.user.id) && !hasEmptyQueue) {
    await interaction.editReply({
      embeds: [client.errorEmbed(errorCodes.not_in_voice)],
    });

    if (playerEmbed) playerEmbed.setDescription(errorCodes.not_in_voice);
    if (guildPlayer.audioPlayer) guildPlayer.audioPlayer.stop();
    if (guildPlayer.voiceConnection) guildPlayer.voiceConnection.destroy();

    try {
      if (playerMessage && playerEmbed)
        await playerMessage.edit({ embeds: [playerEmbed] });
    } finally {
      await client.deleteGuildPlayer(interaction.guildId);
      if (playerThread) playerThread.delete();
    }

    return;
  }

  if (guildPlayer.embed.playerThread)
    sendThreadEmbed(interaction, guildPlayer.embed.playerThread, {
      description: isSongsArray
        ? `📋 Пользователь добавил плейлист **${await getPlaylistTitle(
            userInput
          )}** в очередь!`
        : `📋 Пользователь добавил песню ${await getVideoTitle(
            userInputData.song.url
          )} в очередь!`,
    }).catch(() => {});

  await interaction.editReply({
    embeds: [
      client.successEmbed(
        isSongsArray
          ? `🌿 Плейлист **${await getPlaylistTitle(
              userInput
            )}** был успешно добавлен в очередь!`
          : `🌿 Песня ${await getVideoTitle(
              userInputData.song.url
            )} была успешно добавлена в очередь!`
      ),
    ],
  });

  if (guildPlayer.queue.length <= 1 || hasEmptyQueue) {
    const audioResource = await firstObjectToAudioResource(
      guildPlayer.queue,
      interaction
    );

    guildPlayer.audioPlayer.play(audioResource);

    return;
  }

  if (isForcedInput(interaction)) {
    if (guildPlayer.status.onRepeat) guildPlayer.queue.shift();

    guildPlayer.status.isPaused = false;
    guildPlayer.audioPlayer.stop(true); // Stop the player to play the next song
    return;
  }
}
