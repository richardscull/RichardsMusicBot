import {
  AudioPlayerPlayingState,
  AudioPlayerStatus,
  createAudioPlayer,
  createAudioResource,
  joinVoiceChannel,
  NoSubscriberBehavior,
} from '@discordjs/voice';
import {
  ActionRowBuilder,
  ChannelType,
  ChatInputCommandInteraction,
  ComponentType,
  SlashCommandSubcommandBuilder,
  StageChannel,
  StringSelectMenuBuilder,
  VoiceChannel,
} from 'discord.js';

import { ExtendedClient } from '../../client/ExtendedClient';
import play, { SpotifyTrack, YouTubeVideo } from 'play-dl';
import { guildObject, millisecondsToString, numberWithDots } from '../../utils';

import { client } from '../../client';
import {
  createMusicEmbed,
  createProgressBar,
  sendSongEmbed,
  sendThreadEmbed,
} from './embedsHandler';

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
  const isForcedInput = interaction.options.getBoolean('force', false);
  const userInputUrl = await validateUrl(userInput);
  let userSongUrl = '';

  const guildPlayer = (await client.getGuildPlayer(interaction.guildId))
    ? await client.getGuildPlayer(interaction.guildId)
    : await createGuildPlayer(interaction, client);

  if (!guildPlayer) return;

  const hasEmptyQueue = guildPlayer.queue.length == 0;

  if (typeof userInputUrl === 'string') {
    userSongUrl = userInputUrl;

    if (isForcedInput) {
      spliceSong(interaction, guildPlayer, userSongUrl);
    } else {
      pushSong(interaction, guildPlayer, userSongUrl);
    }
  }

  if (userInputUrl instanceof ActionRowBuilder<StringSelectMenuBuilder>) {
    const getUserChoice = await handleStringSearch(userInputUrl, interaction);
    userSongUrl = getUserChoice;

    if (isForcedInput) {
      spliceSong(interaction, guildPlayer, userSongUrl);
    } else {
      pushSong(interaction, guildPlayer, userSongUrl);
    }
  }

  if (Array.isArray(userInputUrl)) {
    if (isForcedInput) {
      await interaction.editReply({
        embeds: [
          client.errorEmbed(
            `❌ К сожалению вы не можете запустить плейлист сразу!`
          ),
        ],
      });

      return;
    }

    for (let i = 0; i < userInputUrl.length; i++) {
      await pushSong(interaction, guildPlayer, userInputUrl[i]);
    }
  }

  if (typeof userInputUrl === 'undefined') {
    await interaction.editReply({
      embeds: [
        client.errorEmbed(`❌ Я не смог найти результатов по вашему запросу!`),
      ],
    });

    return;
  }

  if (!guildPlayer.voiceConnection.joinConfig.channelId) return;

  const voiceChannel = client.channels.cache.get(
    guildPlayer.voiceConnection.joinConfig.channelId
  ) as VoiceChannel;

  const { playerMessage, playerThread, playerEmbed } = guildPlayer.embed;

  if (!voiceChannel.members.get(interaction.client.user.id) && !hasEmptyQueue) {
    await interaction.editReply({
      embeds: [
        client.errorEmbed(
          `🚪 Бот не был в аудио канале, поэтому плеер был остановлен.`
        ),
      ],
    });

    if (playerEmbed)
      playerEmbed.setDescription(
        `🚪 Бот не был в аудио канале, поэтому плеер был остановлен.`
      );

    try {
      if (playerMessage && playerEmbed)
        await playerMessage.edit({ embeds: [playerEmbed] });
    } finally {
      await client.deleteGuildPlayer(interaction.guildId);
      if (playerThread) playerThread.delete();
    }

    guildPlayer.audioPlayer.stop();
    if (guildPlayer.voiceConnection) guildPlayer.voiceConnection.destroy();
    return;
  }

  if (Array.isArray(userInputUrl)) {
    const playlistTitle = (await play.playlist_info(userInput)).title;

    if (guildPlayer.embed.playerThread)
      sendThreadEmbed(interaction, guildPlayer.embed.playerThread, {
        description: `📋 Пользователь добавил плейлист **${playlistTitle}** в очередь!`,
      });

    await interaction.editReply({
      embeds: [
        client.successEmbed(
          `🌿 Плейлист **${playlistTitle}** был успешно добавлен в очередь!`
        ),
      ],
    });
  } else {
    const videoData = (await play.video_info(userSongUrl)).video_details;

    if (guildPlayer.embed.playerThread)
      sendThreadEmbed(interaction, guildPlayer.embed.playerThread, {
        description: `📋 Пользователь добавил песню ${videoData.title} в очередь!`,
      });

    await interaction.editReply({
      embeds: [
        client.successEmbed(
          `🌿 Песня ${videoData.title} была успешно добавлена в очередь!`
        ),
      ],
    });
  }

  if (guildPlayer.queue.length < 2 || hasEmptyQueue) {
    const audioResource = await urlToAudioResource(guildPlayer.queue[0].song);
    guildPlayer.audioPlayer.play(audioResource);

    return;
  }

  if (isForcedInput) {
    if (guildPlayer.status.onRepeat) guildPlayer.queue.shift();

    guildPlayer.status.isPaused = false;
    guildPlayer.audioPlayer.stop(true);

    return;
  }
}

async function pushSong(
  interaction: ChatInputCommandInteraction<'cached'>,
  guildPlayer: guildObject,
  song: string
) {
  guildPlayer.queue.push({
    user: `${interaction.user.username}#${interaction.user.discriminator}`,
    song: song,
  });
}

async function spliceSong(
  interaction: ChatInputCommandInteraction<'cached'>,
  guildPlayer: guildObject,
  song: string
) {
  guildPlayer.queue.splice(1, 0, {
    user: `${interaction.user.username}#${interaction.user.discriminator}`,
    song: song,
  });
}

async function validateUrl(url: string) {
  if (play.sp_validate(url) !== 'search' && play.is_expired())
    await play.refreshToken();

  if (play.sp_validate(url) === 'track') {
    const spData = (await play.spotify(url)) as SpotifyTrack;
    const searchResult = await play.search(
      `${spData.artists[0].name} ${spData.name}`,
      { limit: 10, source: { youtube: 'video' } }
    );
    return searchResult[0].url;
  }

  if (play.yt_validate(url) === 'video') {
    const videoData = await play.video_info(url);

    if (videoData.LiveStreamData.isLive) {
      return undefined;
    } else {
      return url;
    }
  }

  if (play.yt_validate(url) === 'playlist') {
    const playlist = await play.playlist_info(url);

    return (await playlist.all_videos()).map((video) => video.url);
  }

  if (play.yt_validate(url) === 'search') {
    const filteredResult: YouTubeVideo[] = [];
    const searchResult = await play.search(url, {
      limit: 30,
      source: { youtube: 'video' },
    });
    searchResult.forEach((element) => {
      if (filteredResult.length !== 5 && element.uploadedAt)
        filteredResult.push(element);
    });

    if (!filteredResult.length) return undefined;

    return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('videoSelect')
        .setPlaceholder('Результаты по вашему запросу')
        .setOptions(
          filteredResult.map((video) => ({
            label: video.title ? video.title.slice(0, 99) : '',
            description: `⌛: ${video.durationRaw} | 👀: ${numberWithDots(
              video.views
            )} | 🗓️: ${video.uploadedAt}`,
            value: video.id ? video.id.slice(0, 99) : '',
          }))
        )
    );
  }
}

async function createGuildPlayer(
  interaction: ChatInputCommandInteraction<'cached'>,
  client: ExtendedClient
) {
  const { channel, member, guildId, guild } = interaction;
  const textChannel = channel;
  const memberVoice = member.voice.channel;

  if (!textChannel || !memberVoice) return;

  if (textChannel.isThread() || textChannel.type !== ChannelType.GuildText) {
    interaction.editReply({
      embeds: [
        client.errorEmbed(
          `🙏 Извините, но вы не можете использовать тут эту команду.`
        ),
      ],
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

    const videoData = (await play.video_info(queue[0].song)).video_details;

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
      playbackDuration = queue[0].seek
        ? playbackDuration + queue[0].seek * 1000
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

    if (!status.onRepeat) queue.shift();

    if (queue.length) {
      const audioResource = await urlToAudioResource(
        queue[0].song,
        queue[0]?.seek
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

export async function urlToAudioResource(trackURL: string, seek?: number) {
  const stream = await play.stream(trackURL, { seek: seek });
  return createAudioResource(stream.stream, {
    inputType: stream.type,
  });
}

export async function handleStringSearch(
  searchResults: ActionRowBuilder<StringSelectMenuBuilder>,
  interaction: ChatInputCommandInteraction<'cached'>
) {
  const selectMenu = interaction.editReply({
    components: [searchResults],
  });

  return (await selectMenu)
    .awaitMessageComponent({
      componentType: ComponentType.StringSelect,
      dispose: true,
    })
    .then(async (interaction) => {
      await interaction.update({
        components: [],
        embeds: [
          client.successEmbed(
            `⌛ Пожалуйста, подождите, идет загрузка трека...`
          ),
        ],
      });

      return interaction.values[0];
    });
}
