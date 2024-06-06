import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  BaseImageURLOptions,
  HexColorString,
} from 'discord.js';
import { getAverageColor } from 'fast-average-color-node';

export const data = new SlashCommandBuilder()
  .setName('avatar')
  .setDescription(`Получить аватар пользователя`)
  .addUserOption((option) =>
    option
      .setName('target')
      .setRequired(true)
      .setDescription('Выберите пользователя')
  )
  .addIntegerOption((option) =>
    option
      .setName('size')
      .setRequired(false)
      .setDescription('Выберите размер аватара')
      .addChoices(
        { name: '128', value: 128 },
        { name: '256', value: 256 },
        { name: '512', value: 512 },
        { name: '1024', value: 1024 },
        { name: '2048', value: 2048 },
        { name: '4096', value: 4096 }
      )
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const userAvatar = interaction.options.getUser('target');
  const userAvatarSize = interaction.options.getInteger(
    'size'
  ) as BaseImageURLOptions['size'];

  if (!userAvatar) return;

  const userAvatarColor = await getAverageColor(userAvatar.displayAvatarURL());

  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(userAvatarColor.hex as HexColorString)
        .setDescription('Аватар пользователя: ' + userAvatar.toString())
        .setImage(
          userAvatar.avatarURL({ size: userAvatarSize ? userAvatarSize : 1024 })
        ),
    ],
  });
}
