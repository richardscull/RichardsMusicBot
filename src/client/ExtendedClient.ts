import { Client, EmbedBuilder } from 'discord.js';
import Jsoning from 'jsoning';
import config from '../config';
import * as play from 'play-dl';
import path from 'path';
import * as fs from 'fs';
import { guildObject } from '../utils/types';

export class ExtendedClient extends Client {
  MusicPlayer = new Map<string, guildObject>();

  Database = {
    emojis: new Jsoning('emojis.json'),
  };

  public async DiscordLogin() {
    this.loadEvents();
    this.loginToSpotify();
    return await this.login(config.DISCORD_TOKEN).catch((err) => {
      console.error(`[Discord Login Error]`, err);
      process.exit(1);
    });
  }

  private async loginToSpotify() {
    return await play.setToken({
      spotify: {
        client_id: config.SPOTIFY_ID,
        client_secret: config.SPOTIFY_SECRET,
        refresh_token: config.SPOTIFY_REFRESH_TOKEN,
        market: config.SPOTIFY_MARKET,
      },
    });
  }

  public async RegisterCustomEmojis() {
    if (this.Database.emojis.has('isGuildCreated')) return;
    if (this.guilds.cache.size >= 10)
      throw new Error(
        "❌ Unfortunately bot couldn't register custom emotes.\nRefer to the FAQ on github page to fix this issue!"
      );

    const getBotsGuild = await this.guilds.create({
      name: "Emoji's server",
    });

    this.Database.emojis.set('isGuildCreated', true);

    const emojis = [
      'ProgressBarStart',
      'ProgressBarPlaying',
      'ProgressBarMedium',
      'ProgressBarWaiting',
      'ProgressBarEnd',
    ];
    for (const emoji of emojis) {
      const createdEmoji = await getBotsGuild.emojis.create({
        attachment: `./images/emojis/${emoji}.png`,
        name: emoji,
      });
      await this.Database.emojis.set(emoji, createdEmoji.id);
    }
  }

  private loadEvents() {
    const eventsDir = path.join(__dirname, '..', 'events');
    fs.readdir(eventsDir, (err, files) => {
      if (err) throw new Error("Couldn't find the events dir!");
      else {
        files.forEach((file) => {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const event = require(eventsDir + '/' + file);
          if (event.once) {
            this.once(event.name, (...args) => event.execute(...args));
          } else {
            this.on(event.name, (...args) => event.execute(...args));
          }
        });
      }
    });
  }

  public GetSuccessEmbed(Title: string) {
    const createEmbed = new EmbedBuilder()
      .setTitle(Title.slice(0, 255))
      .setColor('Green')
      .setTimestamp();
    return createEmbed;
  }

  public GetErrorEmbed(Title: string) {
    const createEmbed = new EmbedBuilder()
      .setTitle(Title.slice(0, 255))
      .setColor('Red')
      .setTimestamp();
    return createEmbed;
  }

  public async GetEmoji(emojiName: string) {
    if (this.Database.emojis.has(emojiName)) {
      const emojiId = await this.Database.emojis.get(emojiName);
      return `<:${emojiName}:${emojiId}>`;
    }
  }

  public async GetGuildPlayer(guildID: string) {
    if (this.MusicPlayer.has(guildID)) return this.MusicPlayer.get(guildID);
  }

  public async DeleteGuildPlayer(guildID: string) {
    if (this.MusicPlayer.has(guildID)) return this.MusicPlayer.delete(guildID);
  }

  public async SendEmbed(interaction: any, embed: EmbedBuilder) {
    const reply = {
      content: '',
      embeds: [embed],
      components: [],
    };

    if (interaction.deferred) {
      return await interaction.editReply(reply);
    } else if (interaction.replied) {
      return await interaction.followUp(reply);
    } else {
      return await interaction.reply(reply);
    }
  }
}
