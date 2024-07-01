import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
} from 'discord.js';
import { ExtendedClient } from '../../client/ExtendedClient';
import * as subcommands from './subcommands/index';

export const data = new SlashCommandBuilder()
  .setName('music')
  .setDescription('Музыкальные команды')
  .setDMPermission(false);

for (const subcommand of Object.values(subcommands)) {
  const fakeBuilder = new SlashCommandSubcommandBuilder();
  // TEMPORARY FIX WHILE PLAY-DL API IS FUCKED
  if (subcommand.data(fakeBuilder).name === 'chapters') continue;
  data.addSubcommand(subcommand.data);
}

export async function execute(
  interaction: ChatInputCommandInteraction,
  client: ExtendedClient
) {
  if (!interaction.inCachedGuild()) return;
  await interaction.deferReply({ ephemeral: true });

  const getCurrentVC = interaction.member.voice?.channel;

  if (!getCurrentVC) {
    return await client.SendEmbed(
      interaction,
      client.GetErrorEmbed(
        `❌ Вы должны находиться в голосовом канале, чтобы использовать эту команду!`
      )
    );
  }

  const guildPlayer = await client.GetGuildPlayer(interaction.guildId);
  const commandName = interaction.options.getSubcommand();
  const isCurrentVCHasBot = getCurrentVC.members.has(
    interaction.client.user.id
  );

  if (commandName !== 'play' && (!guildPlayer || !isCurrentVCHasBot)) {
    return await interaction.editReply({
      embeds: [
        client.GetErrorEmbed(
          `❌ Плеер еще не запущен, либо вы находитесь не в том же голосовом канале c ботом!`
        ),
      ],
    });
  }

  for (const subcommand of Object.values(subcommands)) {
    const fakeBuilder = new SlashCommandSubcommandBuilder();
    const subcommandName = subcommand.data(fakeBuilder).name;

    if (commandName === subcommandName) {
      return subcommand.execute(interaction, client);
    }
  }
}
