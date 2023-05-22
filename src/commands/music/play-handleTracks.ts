import { errorCodes, isForcedInput } from './play-utils';
import play, { SpotifyPlaylist, SpotifyTrack, YouTubeVideo } from 'play-dl';
import { numberWithDots, songObject } from '../../utils';
import { client } from '../../client';
import {
  ActionRowBuilder,
  ChatInputCommandInteraction,
  ComponentType,
  StringSelectMenuBuilder,
} from 'discord.js';

async function searchForTrack(
  input: string,
  interaction: ChatInputCommandInteraction<'cached'>
) {
  const filteredResult: YouTubeVideo[] = [];

  const searchResult = await play.search(input, {
    limit: 30,
    source: { youtube: 'video' },
  });

  searchResult.forEach((element) => {
    if (filteredResult.length !== 5 && element.uploadedAt)
      filteredResult.push(element);
  });

  const selectMenu = interaction.editReply({
    components: [
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
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
      ),
    ],
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

      return {
        user: `${interaction.user.username}#${interaction.user.discriminator}`,
        song: {
          type: 'youtube',
          url: interaction.values[0],
        },
      } as songObject;
    });
}

async function getYouTubeTrack(
  url: string,
  interaction: ChatInputCommandInteraction<'cached'>
) {
  try {
    const videoData = await play.video_info(url);

    if (videoData.LiveStreamData.isLive) return errorCodes.is_live;

    return {
      user: `${interaction.user.username}#${interaction.user.discriminator}`,
      song: {
        type: 'youtube',
        url: url,
      },
    } as songObject;
  } catch (error) {
    return errorCodes.bad_request;
  }
}

async function getSpotifyTrack(
  url: string,
  interaction: ChatInputCommandInteraction<'cached'>
) {
  const spData = (await play.spotify(url)) as SpotifyTrack;

  const searchResult = await play.search(
    `${spData.artists[0].name} ${spData.name}`,
    {
      limit: 10,
      source: { youtube: 'video' },
    }
  );

  const filteredResult = searchResult.filter((element) => {
    return element.uploadedAt || element.music;
  });

  if (filteredResult.length === 0) filteredResult[0].url = 'dQw4w9WgXcQ';

  return {
    user: `${interaction.user.username}#${interaction.user.discriminator}`,
    isForced: isForcedInput(interaction),
    song: {
      type: 'youtube',
      url: filteredResult[0].url,
    },
  } as songObject;
}

async function getYouTubePlaylist(
  url: string,
  interaction: ChatInputCommandInteraction<'cached'>
) {
  const playlist = await play.playlist_info(url);

  if (isForcedInput(interaction)) return errorCodes.force_playlist;

  return (await playlist.all_videos()).map((video) => {
    return {
      user: `${interaction.user.username}#${interaction.user.discriminator}`,
      song: {
        type: 'youtube',
        url: video.url,
      },
    } as songObject;
  });
}

async function getSpotifyPlaylist(
  url: string,
  interaction: ChatInputCommandInteraction<'cached'>
) {
  const playlist = (await play.spotify(url)) as SpotifyPlaylist;

  if (isForcedInput(interaction)) return errorCodes.force_playlist;

  return (await playlist.all_tracks()).map((track: SpotifyTrack) => {
    return {
      user: `${interaction.user.username}#${interaction.user.discriminator}`,
      song: {
        type: 'spotify',
        url: track.url,
      },
    } as songObject;
  });
}

export {
  searchForTrack,
  getYouTubeTrack,
  getSpotifyTrack,
  getYouTubePlaylist,
  getSpotifyPlaylist,
};
