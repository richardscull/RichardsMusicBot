import {
  ChatInputCommandInteraction,
  Message,
  SlashCommandBuilder,
} from 'discord.js';
import { ExtendedClient } from '../../client/ExtendedClient';
import {
  data as playSubcommand,
  execute as playExecute,
} from './play-subcommand';
import {
  data as stopSubcommand,
  execute as stopExecute,
} from './stop-subcommand';
import {
  data as repeatSubcommand,
  execute as repeatExecute,
} from './repeat-subcommand';
import {
  data as pauseSubcommand,
  execute as pauseExecute,
} from './pause-subcommand';
import {
  data as skipSubcommand,
  execute as skipExecute,
} from './skip-subcommand';
import {
  data as chaptersSubcommand,
  execute as chaptersExecute,
} from './chapters-subcommand';

export const data = new SlashCommandBuilder()
  .setName('music')
  .setDescription('Музыкальные команды')
  .setDMPermission(false)
  .addSubcommand(playSubcommand)
  .addSubcommand(chaptersSubcommand)
  .addSubcommand(stopSubcommand)
  .addSubcommand(repeatSubcommand)
  .addSubcommand(pauseSubcommand)
  .addSubcommand(skipSubcommand);

export async function execute(
  interaction: ChatInputCommandInteraction,
  client: ExtendedClient
) {
  if (!interaction.inCachedGuild()) return;
  /*   Not sure if deferReply is a best practice here...
  But, as our response from youtube relies on internet connection, it's better to defer the reply */
  await interaction.deferReply({ ephemeral: true });

  const memberInVoice = interaction.member.voice?.channel;
  const commandName = interaction.options.getSubcommand();
  const guildPlayer = await client.getGuildPlayer(interaction.guildId);

  if (!memberInVoice) {
    return await interaction.editReply({
      embeds: [
        client.errorEmbed(
          `❌ Вы должны находиться в голосовом канале, чтобы использовать эту команду!`
        ),
      ],
    });
  } else if (
    commandName !== 'play' &&
    (!guildPlayer || !memberInVoice.members.has(interaction.client.user.id))
  ) {
    return await interaction.editReply({
      embeds: [
        client.errorEmbed(
          `❌ Плеер еще не запущен, либо вы находитесь не в том же голосовом канале c ботом!`
        ),
      ],
    });
  }

  if (commandName in subcommandFunctions) {
    const subcommandFunction = subcommandFunctions[commandName];
    await subcommandFunction(interaction, client);
  }
}

const subcommandFunctions: Record<
  string,
  (
    interaction: ChatInputCommandInteraction<'cached'>,
    client: ExtendedClient
  ) => Promise<void> | Promise<Message<true> | undefined>
> = {
  play: playExecute,
  stop: stopExecute,
  repeat: repeatExecute,
  pause: pauseExecute,
  skip: skipExecute,
  chapters: chaptersExecute,
};

