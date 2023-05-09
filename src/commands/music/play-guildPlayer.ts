import {
  AudioPlayerPlayingState,
  AudioPlayerStatus,
  createAudioPlayer,
  joinVoiceChannel,
  NoSubscriberBehavior,
} from '@discordjs/voice';
import {
  ChannelType,
  ChatInputCommandInteraction,
  StageChannel,
  VoiceChannel,
} from 'discord.js';

import { ExtendedClient } from '../../client/ExtendedClient';
import play from 'play-dl';
import { millisecondsToString } from '../../utils';

import {
  createMusicEmbed,
  createProgressBar,
  sendSongEmbed,
} from './embedsHandler';
import { errorCodes, firstObjectToAudioResource } from './play-utils';

export async function createGuildPlayer(
  interaction: ChatInputCommandInteraction<'cached'>,
  client: ExtendedClient
) {
  const { channel, member, guildId, guild } = interaction;
  const textChannel = channel;
  const memberVoice = member.voice.channel;

  if (!textChannel || !memberVoice) return;

  if (textChannel.isThread() || textChannel.type !== ChannelType.GuildText) {
    interaction.editReply({
      embeds: [client.errorEmbed(errorCodes.no_permission)],
    });
    return;
  }

  const voiceConnection = joinVoiceChannel({
    channelId: memberVoice.id,
    guildId: guildId,
    adapterCreator: guild.voiceAdapterCreator,
  });

  const audioPlayer = createAudioPlayer({
    behaviors: {
      noSubscriber: NoSubscriberBehavior.Play,
    },
  });

  let embedInterval: NodeJS.Timeout;

  audioPlayer.on(AudioPlayerStatus.Paused, async () => {
    const guildPlayer = await client.getGuildPlayer(interaction.guildId);
    if (!guildPlayer) return;
    guildPlayer.status.isPaused = true;
  });

  audioPlayer.on(AudioPlayerStatus.Playing, async () => {
    const guildPlayer = await client.getGuildPlayer(interaction.guildId);

    if (!guildPlayer) return;

    const { embed, status, audioPlayer, queue } = guildPlayer;

    const videoData = (await play.video_info(queue[0].song.url)).video_details;

    if (status.isPaused) return (status.isPaused = false);

    embed.playerEmbed = await createMusicEmbed(guildPlayer, videoData);

    if (!embed.playerMessage && interaction.channel && embed.playerEmbed) {
      if (interaction.channel instanceof StageChannel) return;
      embed.playerMessage = await interaction.channel.send({
        embeds: [embed.playerEmbed],
      });

      embed.playerThread = await embed.playerMessage.startThread({
        name: '🔊 Музыкальный плеер',
      });
    } else if (embed.playerMessage && embed.playerEmbed && embed.playerThread) {
      embed.playerMessage.edit({ embeds: [embed.playerEmbed] });
    }

    if (embed.playerThread)
      await sendSongEmbed(embed.playerThread, videoData, queue[0].user);

    embedInterval = setInterval(async () => {
      if (!guildPlayer.voiceConnection.joinConfig.channelId) return;

      const voiceChannel = client.channels.cache.get(
        guildPlayer.voiceConnection.joinConfig.channelId
      ) as VoiceChannel;

      const { playerMessage, playerThread, playerEmbed } = embed;

      if (!playerEmbed || !playerMessage || !playerThread) return;

      if (!voiceChannel.members.get(interaction.client.user.id)) {
        playerEmbed.setDescription(
          `🚪 Бот не был в аудио канале, поэтому плеер был остановлен.`
        );

        try {
          await playerMessage.edit({ embeds: [playerEmbed] });
        } finally {
          await client.deleteGuildPlayer(guildId);
          playerThread.delete();
        }

        guildPlayer.audioPlayer.stop();
        if (voiceConnection) voiceConnection.destroy();
        return;
      }

      if (voiceChannel.members.size <= 1) {
        playerEmbed.setDescription(
          `🐁 Никто не слушает музыку, поэтому плеер был остановлен.`
        );

        try {
          await playerMessage.edit({ embeds: [playerEmbed] });
        } finally {
          client.deleteGuildPlayer(guildId);
          playerThread.delete();
        }

        guildPlayer.audioPlayer.stop();
        return voiceConnection.destroy();
      }

      const playerState = audioPlayer.state as AudioPlayerPlayingState;

      let { playbackDuration } = playerState;

      playbackDuration = queue[0].song.seek
        ? playbackDuration + queue[0].song.seek * 1000
        : playbackDuration;

      const progressBar = await createProgressBar(
        playbackDuration,
        videoData.durationInSec * 1000,
        8
      );

      await playerMessage
        .edit({
          embeds: [
            playerEmbed
              .setDescription(
                `${status.isPaused ? '⏸ | ' : ''}${
                  status.onRepeat ? '🔁 | ' : ''
                }` +
                  `🎧 ${millisecondsToString(
                    playbackDuration
                  )} ${progressBar} ${videoData.durationRaw}`
              )
              .setFooter({
                text: `📨 Запросил: ${queue[0].user} ${
                  queue.length - 1
                    ? `| 🎼 Треков в очереди: ${queue.length - 1}`
                    : ''
                }`,
              }),
          ],
        })
        .catch(() => {});
    }, 30 * 1000);
  });

  audioPlayer.on(AudioPlayerStatus.Idle, async () => {
    clearInterval(embedInterval);

    const guildPlayer = await client.getGuildPlayer(interaction.guildId);
    if (!guildPlayer) return;
    const { embed, status, queue } = guildPlayer;
    const { playerEmbed, playerMessage, playerThread } = embed;

    if (status.onRepeat) {
      queue[0].song.seek = undefined;
    }

    if (!status.onRepeat || (queue[1] && queue[1].song.seek)) {
      queue.shift();
    }

    if (queue.length) {
      const audioResource = await firstObjectToAudioResource(
        queue,
        interaction
      );

      return guildPlayer.audioPlayer.play(audioResource);
    } else if (playerEmbed) {
      playerEmbed.setDescription(`🌧 Плеер закончил свою работу`);
      try {
        await playerMessage?.edit({ embeds: [playerEmbed] });
      } finally {
        client.deleteGuildPlayer(guildId);
        playerThread?.delete();
      }
      return voiceConnection.destroy();
    }
  });

  voiceConnection.subscribe(audioPlayer);

  client.musicPlayer.set(guildId, {
    voiceConnection: voiceConnection,
    audioPlayer: audioPlayer,
    embed: {},
    queue: [],
    status: {
      isPaused: false,
      onRepeat: false,
    },
  });

  return await client.getGuildPlayer(guildId);
}
