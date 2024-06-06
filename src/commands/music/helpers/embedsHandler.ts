import {
  AnyThreadChannel,
  bold,
  ChatInputCommandInteraction,
  ColorResolvable,
  EmbedBuilder,
  HexColorString,
} from 'discord.js';
import { getAverageColor } from 'fast-average-color-node';
import play from 'play-dl';
import { client } from '../../../client';
import {
  guildObject,
  millisecondsToString,
  numberWithSpaces,
  trackShortInfo,
} from '../../../utils';
import { AudioPlayerPlayingState } from '@discordjs/voice';

interface defaultEmbedOptions {
  description: string;
  color?: ColorResolvable;
}

export function sendThreadEmbed(
  interaction: ChatInputCommandInteraction<'cached'>,
  thread: AnyThreadChannel<boolean>,
  options: defaultEmbedOptions
) {
  const createEmbed = new EmbedBuilder()
    .setAuthor({
      name: interaction.user.username,
      iconURL: interaction.user.displayAvatarURL(),
    })
    .setDescription(options.description.slice(0, 255))
    .setColor(options.color ? options.color : 'Default')
    .setTimestamp();

  return thread.send({ embeds: [createEmbed] });
}

export async function sendSongEmbedToThread(guildPlayer: guildObject) {
  const { queue, embed } = guildPlayer;

  // Don't should be possible, but just in case.
  if (queue[0].song.type === 'spotify') return;

  const videoData = (await play.video_info(queue[0].song.url)).video_details;
  const { title, channel, views, likes, thumbnails, url } = videoData;

  const createEmbed = new EmbedBuilder()
    .setAuthor({
      name: '💭 Сейчас играет:',
    })
    .setColor(
      (await getAverageColor(videoData.thumbnails[3].url)).hex as HexColorString
    )
    .setTitle(title as string)
    .setURL(url)
    .setFields(
      {
        name: bold(`👋 Автор`),
        value: channel ? (channel.name as string) : '',
        inline: true,
      },
      {
        name: bold(`👀 Просмотров`),
        value: numberWithSpaces(views),
        inline: true,
      },
      {
        name: bold(`👍 Лайков`),
        value: numberWithSpaces(likes),
        inline: true,
      }
    )

    .setTimestamp()
    .setFooter({ text: `📨 Запросил: ${queue[0].user}` });

  try {
    createEmbed.setThumbnail(thumbnails[2].url);
  } catch (e) {
    // In commit #30 I removed thumbnails.length - 1, because it was causing error.
    // Don't remember why error could occured, so I will try to get more info about it.
    console.log('⚠️ Thumbnail error: ', e);
  }

  if (embed.playerThread) embed.playerThread.send({ embeds: [createEmbed] });

  return;
}

export async function convertToQueueEmbed(data: trackShortInfo[]) {
  const createEmbed = new EmbedBuilder()
    .setTitle('📜 Очередь')
    .setDescription(
      data
        .map((item) => {
          return `**${item.index ? item.index + '.' : '▶'}** [${item.title}](${
            item.url
          }) ⏳ ${millisecondsToString(item.duration)} `;
        })
        .join('\n')
        .slice(0, 2048)
    )
    .setTimestamp();

  return createEmbed;
}

export async function createMusicEmbed(guildPlayer: guildObject) {
  try {
    const { status, queue, audioPlayer } = guildPlayer;

    // Don't should be possible, but just in case.
    if (queue[0].song.type === 'spotify') return;

    const videoData = (await play.video_info(queue[0].song.url)).video_details;
    const { title, url, thumbnails, channel, durationRaw } = videoData;

    if (!channel?.icons || !channel.name) return;

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

    return new EmbedBuilder()
      .setColor(
        (await getAverageColor(thumbnails[3].url)).hex as HexColorString
      )
      .setAuthor({
        name: `${channel.name}`,
        iconURL: channel.icons[2].url,
        url: channel.url,
      })
      .setTitle(title as string)
      .setURL(url)
      .setDescription(
        `${status.isPaused ? '⏸️ | ' : ''}${
          status.onRepeat ? '🔁 | ' : ''
        }🎧 ${millisecondsToString(
          playbackDuration
        )} ${progressBar} ${durationRaw}`
      )
      .setThumbnail(
        thumbnails[thumbnails.length - 1]
          ? thumbnails[thumbnails.length - 1].url
          : 'https://i.imgur.com/WO45goR.png'
      )
      .setFooter({
        text: `📨 Запросил: ${queue[0].user} ${
          queue.length - 1 ? `| 🎼 Треков в очереди: ${queue.length - 1}` : ''
        }`,
      });
  } catch (e) {
    // In commit #30 I removed thumbnails.length - 1, because it was causing error.
    // Don't remember why error could occured, so I will try to get more info about it.
    console.log('⚠️ Thumbnail error on player: ', e);
  }
}

export async function createProgressBar(
  value: number,
  maxValue: number,
  size: number
) {
  const percentage = value / maxValue;
  const progress = Math.round(size * percentage);
  const emptyProgress = size - progress;

  return (
    `${await client.GetEmoji('ProgressBarStart')}` +
    `${await client
      .GetEmoji('ProgressBarPlaying')
      .then((e) => e?.repeat(progress))}` +
    `${await client.GetEmoji('ProgressBarMedium')}` +
    `${await client
      .GetEmoji('ProgressBarWaiting')
      .then((e) => e?.repeat(emptyProgress))}` +
    `${await client.GetEmoji('ProgressBarEnd')}`
  );
}
