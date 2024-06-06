import dotenv from 'dotenv';
import { styleText } from 'util';
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

    this.updateConfig();
  }

  private updateConfig() {
    const variables = [
      'GITHUB_BRANCH_URL',
      'DISCORD_TOKEN',
      'DISCORD_ID',
      'SPOTIFY_ID',
      'SPOTIFY_SECRET',
      'SPOTIFY_REFRESH_TOKEN',
      'SPOTIFY_MARKET',
    ];

    this.config = variables.reduce(
      (acc, variable) => {
        acc[variable] = process.env[variable] as string;
        return acc;
      },
      {} as Record<string, string>
    );
  }

  private checkDiscordVariables() {
    const discordVariables = ['TOKEN', 'ID'];
    const isEveryVariablePresent = discordVariables.every(
      (variable) => process.env['DISCORD_' + variable]
    );

    if (isEveryVariablePresent) return;

    throw new Error(
      styleText(['yellowBright'], 'Missing arguments in .env file! ⚠️')
    );
  }

  private checkSpotifyVariables() {
    const spotifyVariables = ['ID', 'SECRET', 'REFRESH_TOKEN', 'MARKET'];
    const isEveryVariablePresent = spotifyVariables.every(
      (variable) => process.env['SPOTIFY_' + variable]
    );

    if (isEveryVariablePresent) return;

    throw new Error(
      styleText(['yellowBright'], 'Missing arguments in .env file! ⚠️')
    );
  }

  private checkGithubBranchUrl() {
    let { GITHUB_BRANCH_URL } = process.env;

    const defaultGithubBranch =
      'repos/richardscull/RichardsMusicBot/commits/master';

    process.env.GITHUB_BRANCH_URL = GITHUB_BRANCH_URL
      ? GITHUB_BRANCH_URL
      : defaultGithubBranch;
  }
}

const config = new Config();
export default config.getConfig();
