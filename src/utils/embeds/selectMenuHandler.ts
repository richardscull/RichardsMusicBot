import {
  ActionRowBuilder,
  ButtonBuilder,
  ChatInputCommandInteraction,
  ComponentType,
  StringSelectMenuBuilder,
} from 'discord.js';

import { stringMenuOption } from '../../types';
import PaginateOptions from './paginationTools';

const buttonsRow = new ActionRowBuilder<ButtonBuilder>();
const actionMenuRow = new ActionRowBuilder<StringSelectMenuBuilder>();

export default async function CreateMenuReply(
  interaction: ChatInputCommandInteraction,
  options: stringMenuOption[],
  // eslint-disable-next-line @typescript-eslint/ban-types
  functionToDo: Function
) {
  let pageNum = 0;

  await updateMenuRow();

  const actionRowPaginate = await interaction.editReply({
    components: [actionMenuRow, buttonsRow],
  });

  actionRowPaginate
    .createMessageComponentCollector()
    .on('collect', async (reply) => {
      if (reply.customId === 'chapterSelect') return;

      if (reply.customId == 'right') {
        pageNum++;
      } else if (reply.customId == 'left') {
        pageNum--;
      } else if (reply.customId == 'sLeft') {
        pageNum = 0;
      } else if (reply.customId == 'sRight') {
        pageNum = Math.floor((options.length - 1) / 10);
      }

      await updateMenuRow();

      await reply.editReply({
        components: [actionMenuRow, buttonsRow],
      });
    });

  actionRowPaginate
    .awaitMessageComponent({
      componentType: ComponentType.StringSelect,
      dispose: false,
    })
    .then(async (interaction) => {
      const optionNum = interaction.values[0];
      return functionToDo(options[parseInt(optionNum)], interaction);
    });

  async function updateMenuRow() {
    const finalResult = (await PaginateOptions(
      pageNum,
      buttonsRow,
      options
    )) as stringMenuOption[];

    return actionMenuRow.setComponents(
      new StringSelectMenuBuilder()
        .setCustomId('chapterSelect')
        .setPlaceholder('Результаты по вашему запросу')
        .setOptions(finalResult)
    );
  }
}
