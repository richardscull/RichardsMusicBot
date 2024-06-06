import { Events, ChatInputCommandInteraction } from 'discord.js';
import { client } from '../client/index';
import * as commandModules from '../commands';
import { error } from '../utils/logger';

const commands = Object(commandModules);

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;
    const subcommand = interaction.options.getSubcommand(false);

    try {
      await commands[commandName].execute(interaction, client);
    } catch (err: any) {
      error(
        `\n❌ An error has occurred while executing /${
          interaction.commandName
        } ${subcommand ? subcommand + ' ' : ''}|`,
        err
      );

      const errorMsg =
        '> **Что-то пошло не так... **\n> ⚠️ Похоже возникла ошибка при исполнении этой команды!';
      if (interaction.replied) {
        return await interaction.followUp({
          content: errorMsg,
          ephemeral: true,
        });
      } else if (interaction.deferred) {
        return await interaction.editReply({
          content: errorMsg,
          embeds: [],
          components: [],
        });
      } else {
        return await interaction.reply({
          content: errorMsg,
          ephemeral: true,
        });
      }
    }
  },
};
