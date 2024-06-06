import chalk from 'chalk';
import dotenv from 'dotenv';
dotenv.config();

// TODO: Check later

export class Config {
  private config: Record<string, string> = {};

  public constructor() {
    this.checkEnvVariables();
  }

  public getConfig() {
    return this.config;
  }

  private checkEnvVariables() {
    this.checkDiscordVariables();
    this.checkSpotifyVariables();
    this.checkGithubBranchUrl();

    const { GITHUB_BRANCH_URL } = process.env;
    const { DISCORD_TOKEN, DISCORD_ID } = process.env;
    const {
      SPOTIFY_ID,
      SPOTIFY_SECRET,
      SPOTIFY_REFRESH_TOKEN,
      SPOTIFY_MARKET,
    } = process.env;

    this.config = {
      GITHUB_BRANCH_URL: process.env.GITHUB_BRANCH_URL!,
      DISCORD_TOKEN: process.env.DISCORD_TOKEN!,
      DISCORD_ID: process.env.DISCORD_ID!,
      SPOTIFY_ID: process.env.SPOTIFY_ID!,
      SPOTIFY_SECRET: process.env.SPOTIFY_SECRET!,
      SPOTIFY_REFRESH_TOKEN: process.env.SPOTIFY_REFRESH_TOKEN!,
      SPOTIFY_MARKET: process.env.SPOTIFY_MARKET!,
    };
  }

  private checkDiscordVariables() {
    const discordVariables = ['TOKEN', 'ID'];
    if (
      !discordVariables.every((variable) => process.env['DISCORD_' + variable])
    ) {
      throw new Error(
        chalk.yellowBright('⚠️   Missing arguments in .env file!')
      );
    }
  }

  private checkSpotifyVariables() {
    const spotifyVariables = ['ID', 'SECRET', 'REFRESH_TOKEN', 'MARKET'];
    if (
      !spotifyVariables.every((variable) => process.env['SPOTIFY_' + variable])
    ) {
      throw new Error(
        chalk.yellowBright(
          '⚠️   Missing spotify related arguments in .env file!'
        )
      );
    }
  }

  private checkGithubBranchUrl() {
    let { GITHUB_BRANCH_URL } = process.env;
    const defaultGithubBranch =
      'repos/richardscull/RichardsMusicBot/commits/master';
    GITHUB_BRANCH_URL = GITHUB_BRANCH_URL
      ? GITHUB_BRANCH_URL
      : defaultGithubBranch;
  }
}

const config = new Config();
export default config.getConfig();
