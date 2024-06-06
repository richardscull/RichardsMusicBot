import { createAudioResource } from '@discordjs/voice';
import { ChatInputCommandInteraction, User, VoiceChannel } from 'discord.js';
import {
  PlayerProps,
  guildObject,
  songObject,
  trackShortInfo,
} from '../../../utils';
import {
  getSpotifyPlaylist,
  getSpotifyTrack,
  getYouTubePlaylist,
  getYouTubeTrack,
  searchForTrack,
} from '../HandleTracks';
import play, { SpotifyTrack } from 'play-dl';
import { stopAudioPlayer } from '../subcommands/stop.subcommand';

/*     ERROR CODES       */

export enum errorCodes {
  'force_playlist' = '🙏 Извините, но вы не можете запустить плейлист сразу! ',
  'no_permission' = '🙏 Извините, но у меня нет прав на подключение к вашему голосовому каналу.',
  'no_result' = '🙏 Извините, но я не смог найти ни одного результата по вашему запросу.',
  'bad_request' = '🙏 Извините, но я не могу воспроизвести этот трек.',
  'is_live' = `🙏 Извините, но я не могу воспроизвести стримы.`,
  'not_in_voice' = '🚪 Бот не был в аудио канале, поэтому плеер был остановлен.',
  'nobody_is_listening' = '🐁 Никто не слушает музыку, поэтому плеер был остановлен.',
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

export async function getTrackShortInfo(trackUrl: string) {
  const { title, durationInSec, url } = (await play.video_info(trackUrl))
    .video_details;
  return {
    title: title ? title : '-',
    url: url,
    duration: durationInSec * 1000,
  } as trackShortInfo;
}

export async function getSpotifyTrackInfoShort(trackUrl: string) {
  const { name, durationInMs, url } = (await play.spotify(
    trackUrl
  )) as SpotifyTrack;
  return {
    title: name,
    url: url,
    duration: durationInMs,
  } as trackShortInfo;
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
    discordPlayerCompatibility: true,
  });

  return createAudioResource(stream.stream, {
    inputType: stream.type,
  });
}

export async function ensureValidVoiceConnection(
  voiceChannel: VoiceChannel,
  props: PlayerProps
) {
  const { client, guildPlayer } = props;

  if (!isBotInVoice(voiceChannel, client.user as User)) {
    await stopAudioPlayer(errorCodes.not_in_voice, { client, guildPlayer });
    return false;
  }

  if (!isSomeoneListening(voiceChannel)) {
    await stopAudioPlayer(errorCodes.nobody_is_listening, {
      client,
      guildPlayer,
    });
    return false;
  }

  return true;
}

export function isBotInVoice(voiceChannel: VoiceChannel, botUser: User) {
  if (voiceChannel.members.get(botUser.id)) {
    return true;
  } else {
    return false;
  }
}

export function isSomeoneListening(voiceChannel: VoiceChannel) {
  if (voiceChannel.members.size > 1) {
    return true;
  } else {
    return false;
  }
}
