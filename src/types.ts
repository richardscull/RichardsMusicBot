import { AudioPlayer, VoiceConnection } from '@discordjs/voice';
import { AnyThreadChannel, EmbedBuilder, Message } from 'discord.js';
import { ExtendedClient } from './client/ExtendedClient';

export interface guildObject {
  voiceConnection: VoiceConnection;
  audioPlayer: AudioPlayer;
  queue: Array<songObject>;
  guildId: string;
  interval?: NodeJS.Timeout;
  embed: {
    playerMessage?: Message<true>;
    playerEmbed?: EmbedBuilder;
    playerThread?: AnyThreadChannel<boolean>;
  };
  status: {
    isPaused: boolean;
    onRepeat: boolean;
  };
}

export interface PlayerProps {
  client: ExtendedClient;
  guildPlayer: guildObject;
}

export interface songObject {
  user: string;
  isForced?: boolean;
  song: {
    type: 'spotify' | 'youtube';
    url: string;
    seek?: number;
  };
}

export type stringMenuOption = {
  label: string;
  description: string;
  value: string;
};

export type trackShortInfo = {
  index?: number;
  title: string;
  url: string;
  duration: number;
};
