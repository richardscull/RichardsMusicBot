import { AudioPlayerPlayingState } from '@discordjs/voice';
import {
  ChatInputCommandInteraction,
  SlashCommandSubcommandBuilder,
} from 'discord.js';
import { ExtendedClient } from '../../../client/ExtendedClient';
import { SendThreadEmbed } from '../helpers/embeds.helper';

export const data = (subcommand: SlashCommandSubcommandBuilder) => {
  return subcommand.setName('pause').setDescription('Функция паузы трека');
};

export async function execute(
  interaction: ChatInputCommandInteraction<'cached'>,
  client: ExtendedClient
) {
  const guildPlayer = await client.GetGuildPlayer(interaction.guildId);
  if (!guildPlayer) return;
  const { audioPlayer, embed } = guildPlayer;
  const playerState = audioPlayer.state as AudioPlayerPlayingState;

  const isPlaying = playerState.status === 'playing';
  isPlaying ? audioPlayer.pause() : audioPlayer.unpause();

  const getEmbed = client.GetSuccessEmbed(
    `🌿 Плеер был успешно ${
      isPlaying ? 'поставлен на паузу!' : 'снят с паузы!'
    }`
  );

  if (embed.playerThread)
    SendThreadEmbed(interaction, embed.playerThread, {
      description: `🎶 Пользователь ${
        isPlaying ? `**приостановил**` : `**возобновил**`
      } вещание трека!`,
    }).catch(() => {});

  return await interaction.editReply({
    embeds: [getEmbed],
  });
}
