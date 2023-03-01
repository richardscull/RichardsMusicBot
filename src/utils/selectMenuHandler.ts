import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  ComponentType,
  StringSelectMenuBuilder,
} from 'discord.js';

import { stringMenuOption } from './types';

const buttonsRow = new ActionRowBuilder<ButtonBuilder>();
const actionMenuRow = new ActionRowBuilder<StringSelectMenuBuilder>();

const buttonSuperLeft = new ButtonBuilder()
  .setCustomId('sLeft')
  .setLabel('⏮️')
  .setStyle(ButtonStyle.Primary);

const buttonLeft = new ButtonBuilder()
  .setCustomId('left')
  .setLabel('⬅️')
  .setStyle(ButtonStyle.Primary);

const buttonRight = new ButtonBuilder()
  .setCustomId('right')
  .setLabel('➡️')
  .setStyle(ButtonStyle.Primary);

const buttonSuperRight = new ButtonBuilder()
  .setCustomId('sRight')
  .setLabel('⏭️')
  .setStyle(ButtonStyle.Primary);

export async function createMenuReply(
  interaction: ChatInputCommandInteraction,
  options: stringMenuOption[],
  // eslint-disable-next-line @typescript-eslint/ban-types
  functionToDo: Function
) {
  let pageNum = 0;

  paginateOptions();

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

      paginateOptions();

      await reply.update({
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

  function paginateOptions() {
    const finalResult = [];
    const pageNext = pageNum * 10 + 10;

    for (let i = pageNum * 10; i < pageNext; i++) {
      if (options[i] === undefined) break;

      finalResult.push(options[i]);
    }

    if (pageNum === 0) {
      buttonsRow.setComponents(
        buttonSuperLeft.setDisabled(true),
        buttonLeft.setDisabled(true)
      );

      if (finalResult.length < 10) {
        buttonsRow.addComponents(
          buttonRight.setDisabled(true),
          buttonSuperRight.setDisabled(true)
        );
      } else {
        buttonsRow.addComponents(
          buttonRight.setDisabled(false),
          buttonSuperRight.setDisabled(false)
        );
      }
    } else if (pageNum === Math.floor((options.length - 1) / 10)) {
      buttonsRow.setComponents(
        buttonSuperLeft.setDisabled(false),
        buttonLeft.setDisabled(false),
        buttonRight.setDisabled(true),
        buttonSuperRight.setDisabled(true)
      );
    } else {
      buttonsRow.setComponents(
        buttonSuperLeft.setDisabled(false),
        buttonLeft.setDisabled(false),
        buttonRight.setDisabled(false),
        buttonSuperRight.setDisabled(false)
      );
    }

    return actionMenuRow.setComponents(
      new StringSelectMenuBuilder()
        .setCustomId('chapterSelect')
        .setPlaceholder('Результаты по вашему запросу')
        .setOptions(finalResult)
    );
  }
}
