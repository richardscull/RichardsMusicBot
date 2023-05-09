import {
  AnyThreadChannel,
  bold,
  ChatInputCommandInteraction,
  ColorResolvable,
  EmbedBuilder,
  HexColorString,
} from 'discord.js';
import { getAverageColor } from 'fast-average-color-node';
import { YouTubeVideo } from 'play-dl';
import { client } from '../../client';
import {
  guildObject,
  millisecondsToString,
  numberWithSpaces,
} from '../../utils';

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

export async function sendSongEmbed(
  thread: AnyThreadChannel<boolean>,
  video_data: YouTubeVideo,
  reqest_by: string
) {
  const { title, channel, views, likes, thumbnails, url } = video_data;

  const createEmbed = new EmbedBuilder()
    .setAuthor({
      name: '💭 Сейчас играет:',
    })
    .setColor(
      (await getAverageColor(video_data.thumbnails[3].url))
        .hex as HexColorString
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
    .setThumbnail(thumbnails[3].url)
    .setTimestamp()
    .setFooter({ text: `📨 Запросил: ${reqest_by}` });

  return thread.send({ embeds: [createEmbed] });
}

export async function createMusicEmbed(
  guildPlayer: guildObject,
  videoData: YouTubeVideo
) {
  try {
    const { title, url, thumbnails, channel, durationRaw, durationInSec } =
      videoData;
    const { status, queue } = guildPlayer;
    if (!channel?.icons || !channel.name) return;
    const startTime = queue[0].song.seek ? queue[0].song.seek * 1000 : 0;
    const progressBar = await createProgressBar(
      startTime,
      durationInSec * 1000,
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
        `${status.isPaused ? '⏸ | ' : ''}${
          status.onRepeat ? '🔁 | ' : ''
        }🎧 ${millisecondsToString(startTime)} ${progressBar} ${durationRaw}`
      )
      .setThumbnail(thumbnails[3].url)
      .setFooter({
        text: `📨 Запросил: ${queue[0].user} ${
          queue.length - 1 ? `| 🎼 Треков в очереди: ${queue.length - 1}` : ''
        }`,
      });
  } catch (e) {
    // Empty try/catch, to handle invalid thumbnail fetch.
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
    `${await client.getEmoji('ProgressBarStart')}` +
    `${await client
      .getEmoji('ProgressBarPlaying')
      .then((e) => e?.repeat(progress))}` +
    `${await client.getEmoji('ProgressBarMedium')}` +
    `${await client
      .getEmoji('ProgressBarWaiting')
      .then((e) => e?.repeat(emptyProgress))}` +
    `${await client.getEmoji('ProgressBarEnd')}`
  );
}
