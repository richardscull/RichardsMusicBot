import {
  ActionRowBuilder,
  ButtonBuilder,
  ChatInputCommandInteraction,
} from 'discord.js';

import {
  getSpotifyTrackInfoShort,
  getTrackShortInfo,
} from '../../commands/music/helpers/tracks.helper';

import { client } from '../../client';
import { songObject, trackShortInfo } from '../../types';
import PaginateOptions from './paginationTools';
import { ConvertToQueueEmbed } from '../../commands/music/helpers/embeds.helper';

const buttonsRow = new ActionRowBuilder<ButtonBuilder>();

export default async function CreateListEmbed(
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

      await reply.deferUpdate();

      if (reply.customId == 'right') {
        pageNum++;
      } else if (reply.customId == 'left') {
        pageNum--;
      } else if (reply.customId == 'sLeft') {
        pageNum = 0;
      } else if (reply.customId == 'sRight') {
        pageNum = Math.floor((options.length - 1) / 10);
      }

      await reply.editReply({
        embeds: [
          client.GetSuccessEmbed(
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
    const finalResult = (await PaginateOptions(
      pageNum,
      buttonsRow,
      options
    )) as songObject[];

    const convertedUrlsToTitles = [] as trackShortInfo[];
    const promises = finalResult.map(async (element) => {
      const { type, url } = element.song;
      let result;

      if (type === 'youtube') {
        result = await getTrackShortInfo(url);
      } else if (type === 'spotify') {
        result = await getSpotifyTrackInfoShort(url);
      }

      if (result) return result;
    });

    const resolvedPromises = await Promise.all(promises);
    resolvedPromises.forEach((element) => {
      if (element) convertedUrlsToTitles.push(element);
    });

    convertedUrlsToTitles.map((item, index) => {
      item.index = pageNum * 10 + index;
      return item;
    });

    return ConvertToQueueEmbed(convertedUrlsToTitles);
  }
}
