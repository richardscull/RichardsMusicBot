import {
  ActionRowBuilder,
  ButtonBuilder,
  ChatInputCommandInteraction,
} from 'discord.js';

import {
  getSpotifyTrackInfoShort,
  getTrackShortInfo,
} from '../commands/music/play-utils';

import { client } from '../client';
import { songObject } from './types';
import { paginateOptions } from './paginationTools';
import { convertToQueueEmbed } from '../commands/music/embedsHandler';

const buttonsRow = new ActionRowBuilder<ButtonBuilder>();

export async function createListEmbed(
  interaction: ChatInputCommandInteraction,
  options: songObject[]
) {
  let pageNum = 0;

  const queueList = await getUpdatedEmbed();

  const actionRowPaginate = await interaction.editReply({
    embeds: [queueList],
    components: [buttonsRow],
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

      await reply.update({
        embeds: [
          client.successEmbed(
            '⌛ Пожалуйста, подождите, идет загрузка трека...'
          ),
        ],
        components: [],
      });

      const queueList = await getUpdatedEmbed();

      await reply.editReply({
        embeds: [queueList],
        components: [buttonsRow],
      });
    });

  async function getUpdatedEmbed() {
    const finalResult = (await paginateOptions(
      pageNum,
      buttonsRow,
      options
    )) as songObject[];

    const convertedUrlsToTitles = [];
    for (const element of finalResult) {
      const { type, url } = element.song;
      let result;

      if (type === 'youtube') {
        result = await getTrackShortInfo(url);
      } else if (type === 'spotify') {
        result = await getSpotifyTrackInfoShort(url);
      }

      if (result) convertedUrlsToTitles.push(result);
    }

    convertedUrlsToTitles.map((item, index) => {
      item.index = pageNum * 10 + index;
      return item;
    });

    return convertToQueueEmbed(convertedUrlsToTitles);
  }
}
