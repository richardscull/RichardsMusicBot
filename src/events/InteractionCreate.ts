import { Events, ChatInputCommandInteraction } from 'discord.js';
import { client } from '../client/index';
import * as commandModules from '../commands';
const commands = Object(commandModules);

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;
    try {
      await commands[commandName].execute(interaction, client);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      const getSubcommand = interaction.options.getSubcommand(false);
      console.error(
        `\n❌ An error has occurred while executing /${
          interaction.commandName
        } ${getSubcommand ? getSubcommand + ' ' : ''}|`,
        error
      );
      if (error.code === 10062)
        return console.log(
          "\n💭 Look's like server-side took too long to handle initial response.\nIf you see this error very often, try to deferReply all Interactions.\n"
        );

      if (interaction.replied) {
        return await interaction.followUp({
          content:
            '> **Что-то пошло не так... **\n> ⚠️ Похоже возникла ошибка при исполнении этой команды!',
          ephemeral: true,
        });
      } else if (interaction.deferred) {
        return await interaction.editReply({
          content:
            '> **Что-то пошло не так... **\n> ⚠️ Похоже возникла ошибка при исполнении этой команды!',
        });
      } else {
        return await interaction.reply({
          content:
            '> **Что-то пошло не так... **\n> ⚠️ Похоже возникла ошибка при исполнении этой команды!',
          ephemeral: true,
        });
      }
    }
  },
};
