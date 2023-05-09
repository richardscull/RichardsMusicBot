import { createAudioResource } from '@discordjs/voice';
import { ChatInputCommandInteraction } from 'discord.js';
import { guildObject, songObject } from '../../utils';
import {
  getSpotifyPlaylist,
  getSpotifyTrack,
  getYouTubePlaylist,
  getYouTubeTrack,
  searchForTrack,
} from './play-handleTracks';
import play from 'play-dl';

/*     ERROR CODES       */

export enum errorCodes {
  'force_playlist' = '🙏 Извините, но вы не можете запустить плейлист сразу! ',
  'no_permission' = '🙏 Извините, но у меня нет прав на подключение к вашему голосовому каналу.',
  'no_result' = '🙏 Извините, но я не смог найти ни одного результата по вашему запросу.',
  'not_in_voice' = '🚪 Бот не был в аудио канале, поэтому плеер был остановлен.',
  'is_live' = `🙏 Извините, но я не могу воспроизвести стримы.`,
}

/*     FUNCTIONS      */

export async function validateInput(
  input: string,
  interaction: ChatInputCommandInteraction<'cached'>
) {
  if (play.sp_validate(input) !== 'search' && play.is_expired())
    await play.refreshToken();

  const validateType = await play.validate(input);

  switch (validateType) {
    case 'sp_album':
    case 'sp_playlist':
      return getSpotifyPlaylist(input, interaction);
    case 'sp_track':
      return getSpotifyTrack(input, interaction);

    case 'yt_playlist':
      return getYouTubePlaylist(input, interaction);
    case 'yt_video':
      return getYouTubeTrack(input, interaction);

    case 'search':
      return await searchForTrack(input, interaction);

    default:
      return undefined;
  }
}

export function isForcedInput(
  interaction: ChatInputCommandInteraction<'cached'>
) {
  return interaction.options.getBoolean('force', false) ? true : false;
}

export async function getPlaylistTitle(url: string) {
  switch (await play.validate(url)) {
    case 'sp_album':
    case 'sp_playlist':
      return (await play.spotify(url)).name;

    case 'yt_playlist':
      return (await play.playlist_info(url)).title;
  }
}

export async function getVideoTitle(url: string) {
  return (await play.video_info(url)).video_details.title;
}

export async function pushSong(guildPlayer: guildObject, song: songObject) {
  guildPlayer.queue.push(song);
}

export async function spliceSong(guildPlayer: guildObject, song: songObject) {
  guildPlayer.queue.splice(1, 0, song);
}

export async function firstObjectToAudioResource(
  songObject: songObject[],
  interaction: ChatInputCommandInteraction<'cached'>
) {
  const { type, seek } = songObject[0].song;

  if (type === 'spotify') {
    songObject[0] = await getSpotifyTrack(songObject[0].song.url, interaction);
  }

  const stream = await play.stream(songObject[0].song.url, {
    seek: seek,
  });

  return createAudioResource(stream.stream, {
    inputType: stream.type,
  });
}
