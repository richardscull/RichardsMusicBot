import {
  SlashCommandBuilder,
  bold,
  time,
  inlineCode,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  EmbedBuilder,
  AttachmentBuilder,
} from 'discord.js';
import os from 'os';
import { ExtendedClient } from '../../client/ExtendedClient';
import axios from 'axios';
import config from '../../config';
import path from 'path';
import Pluralize from '../../utils/textConversion/pluralize';

export const data = new SlashCommandBuilder()
  .setName('status')
  .setDescription(`Статус Discord бота`);

const imgForEmbed = new AttachmentBuilder(
  path.join(__dirname, '..', '..', '..', 'images', 'statusEmbed.png'),
  { name: 'statusEmbed.png' }
);

export async function execute(
  interaction: ChatInputCommandInteraction,
  client: ExtendedClient
) {
  const buttonsRow = new ActionRowBuilder<ButtonBuilder>().setComponents(
    new ButtonBuilder()
      .setURL('https://github.com/richardscull/RichardsMusicBot')
      .setLabel('‎ '.repeat(16) + '📂 GitHub' + '‎ '.repeat(16))
      .setStyle(ButtonStyle.Link)
  );

  const guildsCached = client.guilds.cache.size;

  const usersInGuilds = client.guilds.cache
    .reduce((acc, guild) => acc + guild.memberCount, 0)
    .toString();

  if (!client.readyAt || !client.user) return;

  const statusEmbed = new EmbedBuilder()
    .setAuthor({
      name: 'Технический отчет бота',
      iconURL: client.user.displayAvatarURL(),
    })
    .setColor('NotQuiteBlack')
    .setTitle(`> "${client.user.username}"`)
    .setFields(
      {
        name: bold(`📋 Общая информация`).toString(),
        value:
          `‣ Бот установлен на ${bold(guildsCached.toString())} ` +
          Pluralize(guildsCached, 'сервер', {
            oneObject: 'е',
            manyObjects: 'ах',
          }) +
          `.\n` +
          `‣ Бот обслуживает ${bold(usersInGuilds)} ` +
          Pluralize(guildsCached, 'пользовател', {
            oneObject: 'я',
            manyObjects: 'ей',
          }) +
          `.\n` +
          `‣ Рестарт был: ${time(client.readyAt, 'R')}.`,
        inline: true,
      },
      {
        name: '🔧 Техническая информация',
        value:
          `‣ Версия бота: Загрузка...\n` +
          `‣ Обновление было: Загрузка...\n` +
          `‣ Рестарт сервера был: ${time(
            Math.floor(Date.now() / 1000 - os.uptime()),
            'R'
          )}.`,
        inline: true,
      }
    )
    .setFooter({
      text: `⚙️ Использовано памяти: Загрузка...; 🪄 Пинг: Загрузка...`,
    });

  const statusMsg = await interaction.reply({
    embeds: [statusEmbed],
    components: [buttonsRow],
    fetchReply: true,
  });

  const commitData = await axios({
    baseURL: 'https://api.github.com/',
    url: config.GITHUB_BRANCH_URL,
  }).then((result) => result.data);

  const lastestCommitId = commitData.sha;
  const lastestCommitDate = Math.floor(
    new Date(commitData.commit.author.date).getTime() / 1000
  );

  if (statusEmbed && statusEmbed.data && statusEmbed.data.fields) {
    statusEmbed.data.fields[1].value =
      `‣ Версия бота: ${inlineCode(lastestCommitId.slice(0, 7))}.\n` +
      `‣ Обновление было: ${time(lastestCommitDate, 'R')}.\n` +
      `‣ Рестарт сервера был: <t:${Math.floor(
        Date.now() / 1000 - os.uptime()
      )}:R>.`;
  }

  const totalPing = statusMsg.createdTimestamp - interaction.createdTimestamp;
  const used = process.memoryUsage().heapUsed / 1024 / 1024;
  const usedMemory = `${Math.round(used * 100) / 100} MB`;

  statusEmbed.setFooter({
    text: `⚙️ Использовано памяти: ${usedMemory}; 🪄 Пинг: ${totalPing}мс`,
  });
  statusEmbed.setImage(`attachment://${imgForEmbed.name}`);
  await interaction.editReply({
    embeds: [statusEmbed],
    files: [imgForEmbed],
    components: [buttonsRow],
  });
}
