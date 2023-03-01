import chalk from 'chalk';
import dotenv from 'dotenv';
dotenv.config();
const {
  DISCORD_SECRET,
  DISCORD_TOKEN,
  DISCORD_ID,
  SPOTIFY_ID,
  SPOTIFY_SECRET,
  SPOTIFY_REFRESH_TOKEN,
  SPOTIFY_MARKET,
} = process.env;
let { GITHUB_BRANCH_URL } = process.env;

if (!DISCORD_SECRET || !DISCORD_TOKEN || !DISCORD_ID) {
  throw new Error(chalk.yellowBright('⚠️   Missing arguments in .env file!'));
}

if (
  !SPOTIFY_ID ||
  !SPOTIFY_SECRET ||
  !SPOTIFY_REFRESH_TOKEN ||
  !SPOTIFY_MARKET
) {
  throw new Error(
    chalk.yellowBright('⚠️   Missing spotify related arguments in .env file!')
  );
}

const defaultGithubBranch =
  'repos/richardscull/RichardsCoffeeShop/commits/master'; //TO CHANGE
GITHUB_BRANCH_URL = GITHUB_BRANCH_URL ? GITHUB_BRANCH_URL : defaultGithubBranch;

const config: Record<string, string> = {
  DISCORD_ID,
  DISCORD_TOKEN,
  DISCORD_SECRET,
  GITHUB_BRANCH_URL,
  SPOTIFY_ID,
  SPOTIFY_SECRET,
  SPOTIFY_REFRESH_TOKEN,
  SPOTIFY_MARKET,
};

export default config;
