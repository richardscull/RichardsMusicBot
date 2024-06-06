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
import { AudioPlayerPlayingState } from '@discordjs/voice';
import { guildObject, trackShortInfo } from '../../../types';
import numberWith from '../../../utils/textConversion/numberWith';
import { MillisecondsToString } from '../../../utils/textConversion/secondsTo';
import { CheckIfAvaliable } from '../../../utils/fetch';
import { error } from '../../../utils/logger';

interface defaultEmbedOptions {
  description: string;
  color?: ColorResolvable;
}

export function SendThreadEmbed(
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

  return thread.send({ embeds: [createEmbed] }).catch(() => {
    error('Failed to send embed to thread');
  });
}

export async function SendSongEmbedToThread(guildPlayer: guildObject) {
  const { queue, embed } = guildPlayer;

  // Shouldn't be possible, but just in case.
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
    .setThumbnail(await getValidThumbnail(thumbnails))
    .setFields(
      {
        name: bold(`👋 Автор`),
        value: channel ? (channel.name as string) : '',
        inline: true,
      },
      {
        name: bold(`👀 Просмотров`),
        value: numberWith(views, ' '),
        inline: true,
      },
      {
        name: bold(`👍 Лайков`),
        value: numberWith(likes, ' '),
        inline: true,
      }
    )

    .setTimestamp()
    .setFooter({ text: `📨 Запросил: ${queue[0].user}` });

  if (embed.playerThread)
    embed.playerThread.send({ embeds: [createEmbed] }).catch(() => {});

  return;
}

export async function ConvertToQueueEmbed(data: trackShortInfo[]) {
  const createEmbed = new EmbedBuilder()
    .setTitle('📜 Очередь')
    .setDescription(
      data
        .map((item) => {
          return `**${item.index ? item.index + '.' : '▶'}** [${item.title}](${
            item.url
          }) ⏳ ${MillisecondsToString(item.duration)} `;
        })
        .join('\n')
        .slice(0, 2048)
    )
    .setTimestamp();

  return createEmbed;
}

export async function CreateMusicEmbed(guildPlayer: guildObject) {
  const { status, queue, audioPlayer } = guildPlayer;

  // Shouldn't be possible, but just in case.
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
    .setColor((await getAverageColor(thumbnails[3].url)).hex as HexColorString)
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
      }🎧 ${MillisecondsToString(
        playbackDuration
      )} ${progressBar} ${durationRaw}`
    )
    .setThumbnail(await getValidThumbnail(thumbnails))
    .setFooter({
      text: `📨 Запросил: ${queue[0].user} ${
        queue.length - 1 ? `| 🎼 Треков в очереди: ${queue.length - 1}` : ''
      }`,
    });
}

async function createProgressBar(
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

async function getValidThumbnail(thumbnails: any) {
  for (let i = thumbnails.length - 1; i >= 0; i--) {
    const isAvaliable = await CheckIfAvaliable(thumbnails[i].url);
    if (isAvaliable) return thumbnails[i].url;
  }
  return 'https://i.imgur.com/WO45goR.png';
}
