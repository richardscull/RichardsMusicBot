import { AudioPlayer, VoiceConnection } from '@discordjs/voice';
import { AnyThreadChannel, EmbedBuilder, Message } from 'discord.js';

export interface guildObject {
  voiceConnection: VoiceConnection;
  audioPlayer: AudioPlayer;
  queue: Array<songObject>;
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

export interface songObject {
  user: string;
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
