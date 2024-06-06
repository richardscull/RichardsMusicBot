import { ActionRowBuilder, ButtonStyle, ButtonBuilder } from 'discord.js';

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

export default async function PaginateOptions(
  pageIndex: number,
  buttonsRow: ActionRowBuilder<ButtonBuilder>,
  options: unknown[]
) {
  const finalResult = [];
  const pageNext = pageIndex * 10 + 10;

  for (let i = pageIndex * 10; i < pageNext; i++) {
    if (options[i] === undefined) break;

    finalResult.push(options[i]);
  }

  if (pageIndex === 0) {
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
  } else if (pageIndex === Math.floor((options.length - 1) / 10)) {
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

  return finalResult;
}
