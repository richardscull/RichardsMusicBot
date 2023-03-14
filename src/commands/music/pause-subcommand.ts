import { AudioPlayerPlayingState } from '@discordjs/voice';
import {
  ChatInputCommandInteraction,
  SlashCommandSubcommandBuilder,
} from 'discord.js';
import { ExtendedClient } from '../../client/ExtendedClient';
import { sendThreadEmbed } from './embedsHandler';

export const data = (subcommand: SlashCommandSubcommandBuilder) => {
  return subcommand.setName('pause').setDescription('Функция паузы трека');
};

export async function execute(
  interaction: ChatInputCommandInteraction<'cached'>,
  client: ExtendedClient
) {
  const guildPlayer = await client.getGuildPlayer(interaction.guildId);
  if (!guildPlayer) return;
  const { audioPlayer, status, embed } = guildPlayer;
  const playerState = audioPlayer.state as AudioPlayerPlayingState;
  playerState.status === 'playing'
    ? audioPlayer.pause()
    : audioPlayer.unpause();

  const getEmbed = client.successEmbed(
    `🌿 Плеер был успешно ${
      status.isPaused ? 'снят с паузы!' : 'поставлен на паузу!'
    }`
  );

  if (embed.playerThread)
    sendThreadEmbed(interaction, embed.playerThread, {
      description: `🎶 Пользователь ${
        status.isPaused ? `**возобновил**` : `**приостановил**`
      } вещание трека!`,
    }).catch(() => {});

  return await interaction.editReply({
    embeds: [getEmbed],
  });
}
