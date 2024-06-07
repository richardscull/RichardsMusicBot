import {
  AudioPlayer,
  AudioPlayerStatus,
  createAudioPlayer,
  entersState,
  joinVoiceChannel,
  NoSubscriberBehavior,
  VoiceConnectionStatus,
} from '@discordjs/voice';
import {
  ChannelType,
  ChatInputCommandInteraction,
  StageChannel,
  VoiceChannel,
} from 'discord.js';

import { ExtendedClient } from '../../client/ExtendedClient';

import {
  ensureValidVoiceConnection,
  errorCodes,
  firstObjectToAudioResource,
} from './helpers/tracks.helper';
import { stopAudioPlayer } from './subcommands/stop.subcommand';
import { guildObject } from '../../types';
import {
  CreateMusicEmbed,
  SendSongEmbedToThread,
} from './helpers/embeds.helper';
import { error } from '../../utils/logger';

export async function createGuildPlayer(
  interaction: ChatInputCommandInteraction<'cached'>,
  client: ExtendedClient
) {
  const { channel, member, guildId, guild } = interaction;
  const voiceChannel = member.voice.channel;

  if (!channel || !voiceChannel) return;

  if (
    channel.isThread() ||
    channel.type !== ChannelType.GuildText ||
    interaction.channel instanceof StageChannel
  ) {
    interaction.editReply({
      embeds: [client.GetErrorEmbed(errorCodes.no_permission)],
    });
    return;
  }

  const voiceConnection = joinVoiceChannel({
    channelId: voiceChannel.id,
    guildId: guildId,
    adapterCreator: guild.voiceAdapterCreator,
  });

  // Give the bot 5 seconds to connect to the voice channel if recconected (being moved to another channel)
  voiceConnection.on(VoiceConnectionStatus.Disconnected, async () => {
    try {
      await Promise.race([
        entersState(voiceConnection, VoiceConnectionStatus.Signalling, 5_000),
        entersState(voiceConnection, VoiceConnectionStatus.Connecting, 5_000),
      ]);
    } catch (error) {
      const guildPlayer = await client.GetGuildPlayer(interaction.guildId);
      if (!guildPlayer) return voiceConnection.destroy();

      stopAudioPlayer(`⚠️ Произошла непредвиденная ошибка`, {
        client,
        guildPlayer,
      });
    }
  });

  const audioPlayer = createAudioPlayer({
    behaviors: {
      noSubscriber: NoSubscriberBehavior.Play,
    },
  });

  await setAudioPlayerBehavior(audioPlayer, interaction, client);

  voiceConnection.subscribe(audioPlayer);

  const guildPlayerProps = {
    startTime: Date.now(),
    voiceConnection: voiceConnection,
    audioPlayer: audioPlayer,
    guildId: guildId,
    embed: {},
    queue: [],
    status: {
      isPaused: false,
      onRepeat: false,
    },
  };

  client.MusicPlayer.set(guildId, guildPlayerProps);
  return guildPlayerProps as guildObject;
}

async function setAudioPlayerBehavior(
  audioPlayer: AudioPlayer,
  interaction: ChatInputCommandInteraction<'cached'>,
  client: ExtendedClient
) {
  audioPlayer.on(AudioPlayerStatus.Paused, async () => {
    const guildPlayer = await client.GetGuildPlayer(interaction.guildId);
    if (guildPlayer) guildPlayer.status.isPaused = true;
  });

  audioPlayer.on(AudioPlayerStatus.Playing, async () => {
    const guildPlayer = await client.GetGuildPlayer(interaction.guildId);
    if (!guildPlayer) return;

    const isPaused = guildPlayer.status.isPaused === true;
    if (isPaused) return (guildPlayer.status.isPaused = false);

    const { embed } = guildPlayer;

    embed.playerEmbed = await CreateMusicEmbed(guildPlayer);
    if (!embed.playerEmbed) return;

    if (embed.playerMessage) {
      embed.playerMessage.edit({ embeds: [embed.playerEmbed] });
    } else {
      if (!interaction.channel) return;

      embed.playerMessage = await interaction.channel
        .send({
          embeds: [embed.playerEmbed],
        })
        .catch(() => error(`Ошибка при отправке сообщения в канал`))
        .then((message) => message as never);
    }

    if (!embed.playerMessage) return;

    if (!embed.playerThread) {
      embed.playerThread = await embed.playerMessage.startThread({
        name: '🔊 Музыкальный плеер',
      });
    }

    await SendSongEmbedToThread(guildPlayer);

    if (guildPlayer.interval) clearInterval(guildPlayer.interval);
    guildPlayer.interval = setInterval(
      async () => await onIntervalUpdate(),
      30 * 1000 // 30 seconds
    );
  });

  audioPlayer.on(AudioPlayerStatus.Idle, async () => {
    const guildPlayer = await client.GetGuildPlayer(interaction.guildId);
    if (!guildPlayer || !guildPlayer.voiceConnection.joinConfig.channelId)
      return;

    clearInterval(guildPlayer.interval);

    const { status, queue } = guildPlayer;

    if (status.onRepeat) queue[0].song.seek = undefined;

    /*  NOTE: The second condition ensures that if the next song has a seek value,
     indicating that the user has changed the chapter of the current song,
    we shift to a current song that has an updated seek position.  */
    if (!status.onRepeat || (queue[1] && queue[1].song.seek)) {
      queue.shift();
    }

    const voiceChannel = client.channels.cache.get(
      guildPlayer.voiceConnection.joinConfig.channelId
    ) as VoiceChannel;

    await ensureValidVoiceConnection(voiceChannel, {
      client,
      guildPlayer,
    });

    if (queue.length) {
      const audioResource = await firstObjectToAudioResource(
        queue,
        interaction
      );
      return guildPlayer.audioPlayer.play(audioResource);
    } else {
      await stopAudioPlayer(`🌧 Плеер закончил свою работу`, {
        client,
        guildPlayer,
      });
    }
  });

  async function onIntervalUpdate() {
    const guildPlayer = await client.GetGuildPlayer(interaction.guildId);

    if (!guildPlayer || !guildPlayer.voiceConnection.joinConfig.channelId)
      return;

    const voiceChannel = client.channels.cache.get(
      guildPlayer.voiceConnection.joinConfig.channelId
    ) as VoiceChannel;

    const isSafeToEdit = await ensureValidVoiceConnection(voiceChannel, {
      client,
      guildPlayer,
    });

    if (isSafeToEdit === false) return;

    const { embed } = guildPlayer;
    const { playerMessage, playerThread, playerEmbed } = embed;

    if (!playerEmbed || !playerMessage || !playerThread) return;

    embed.playerEmbed = await CreateMusicEmbed(guildPlayer);

    if (embed.playerMessage && embed.playerEmbed)
      embed.playerMessage.edit({ embeds: [embed.playerEmbed] }).catch(() => {});
  }
}
