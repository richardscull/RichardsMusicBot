import {
  ActionRowBuilder,
  AnyThreadChannel,
  bold,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  ColorResolvable,
  EmbedBuilder,
  HexColorString,
} from 'discord.js';
import { getAverageColor } from 'fast-average-color-node';
import { client } from '../../../client';
import { AudioPlayerPlayingState } from '@discordjs/voice';
import { guildObject, trackShortInfo } from '../../../types';
import numberWith from '../../../utils/textConversion/numberWith';
import { MillisecondsToString } from '../../../utils/textConversion/secondsTo';
import { CheckIfAvaliable } from '../../../utils/fetch';
import { error } from '../../../utils/logger';
import { getTrackInfo } from './tracks.helper';

interface defaultEmbedOptions {
  description: string;
  color?: ColorResolvable;
}

export async function SendThreadEmbed(
  interaction: ChatInputCommandInteraction<'cached'>,
  thread: AnyThreadChannel<boolean>,
  options: defaultEmbedOptions
) {
  const embedColor = options.color ? options.color : 'Default';
  const createEmbed = new EmbedBuilder()
    .setAuthor({
      name: interaction.user.username,
      iconURL: interaction.user.displayAvatarURL(),
    })
    .setDescription(options.description.slice(0, 255))
    .setColor(embedColor)
    .setTimestamp();

  return await thread.send({ embeds: [createEmbed] }).catch(() => {
    error('Failed to send embed to thread');
  });
}

export async function SendSongEmbedToThread(guildPlayer: guildObject) {
  const { queue, embed } = guildPlayer;
  const currentTrack = queue[0].song.url;

  const videoData = await getTrackInfo(currentTrack);
  const { title, channel, views, thumbnails, url } = videoData;

  const averageColor = await getAverageColor(await getValidImage(thumbnails));
  const embedColor = averageColor.hex as HexColorString;

  const createEmbed = new EmbedBuilder()
    .setAuthor({
      name: '💭 Сейчас играет:',
    })
    .setColor(embedColor)
    .setTitle(title || 'Неизвестно')
    .setThumbnail(await getValidImage(thumbnails))
    .setFields(
      {
        name: bold(`👋 Автор`),
        value: channel ? (channel.name as string) : '',
      },
      {
        name: bold(`👀 Просмотров`),
        value: numberWith(views, ' '),
      }
    )
    .setFooter({
      text: `📨 Запросил: ${queue[0]?.user || 'Неизвестно'}`.slice(0, 255),
    });

  const actionRowWithLink = new ActionRowBuilder<ButtonBuilder>().setComponents(
    new ButtonBuilder()
      .setURL(url)
      .setLabel('👀 Посмотреть на YouTube')
      .setStyle(ButtonStyle.Link)
  );

  if (embed.playerThread)
    embed.playerThread
      .send({ embeds: [createEmbed], components: [actionRowWithLink] })
      .catch(() => {});

  return;
}

export async function CreateMusicEmbed(guildPlayer: guildObject) {
  const { status, queue, audioPlayer } = guildPlayer;
  const currentTrack = queue[0].song.url;

  const videoData = await getTrackInfo(currentTrack);
  const { title, url, thumbnails, channel, durationRaw } = videoData;

  let { playbackDuration } = audioPlayer.state as AudioPlayerPlayingState;
  // Adjust the playback duration if the song has a seek value.
  if (queue[0].song.seek) playbackDuration += queue[0].song.seek * 1000;

  const progressBar = await createProgressBar(
    playbackDuration,
    videoData.durationInSec * 1000
  );

  const pauseStatus = status.isPaused ? '⏸️ | ' : '';
  const repeatStatus = status.onRepeat ? '🔁 | ' : '';
  const description = `${pauseStatus}${repeatStatus}🎧 ${MillisecondsToString(
    playbackDuration
  )} ${progressBar} ${durationRaw}`;

  const averageColor = await getAverageColor(await getValidImage(thumbnails));
  const embedColor = averageColor.hex as HexColorString;

  return new EmbedBuilder()
    .setColor(embedColor)
    .setAuthor({
      name: `${channel?.name}`,
      iconURL: await getValidImage(channel?.icons),
      url: channel?.url || 'https://www.youtube.com/',
    })
    .setTitle(title || 'Неизвестно')
    .setURL(url)
    .setDescription(description)
    .setThumbnail(await getValidImage(thumbnails))
    .setFooter({
      text: `📨 Запросил: ${queue[0].user || 'Неизвестно'} ${
        queue.length - 1 ? `| 🎼 Треков в очереди: ${queue.length - 1}` : ''
      }`.slice(0, 255),
    });
}

export async function ConvertToQueueEmbed(data: trackShortInfo[]) {
  const queueText = data.map((item) => {
    return `**${item.index ? item.index + '.' : '▶'}** [${item.title}](${
      item.url
    }) ⏳ ${MillisecondsToString(item.duration)} `;
  });

  const createEmbed = new EmbedBuilder()
    .setTitle('📜 Очередь')
    .setDescription(queueText.join('\n').slice(0, 2048))
    .setTimestamp();

  return createEmbed;
}

async function createProgressBar(value: number, maxValue: number) {
  const size = 8;
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getValidImage(images: any) {
  for (let i = images.length - 1; i >= 0; i--) {
    const isAvaliable = await CheckIfAvaliable(images[i].url);
    if (isAvaliable) return images[i].url;
  }
  return 'https://i.imgur.com/WO45goR.png';
}
