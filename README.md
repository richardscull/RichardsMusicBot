<h1 align="center">Richard's Music Bot</h1>
<h1 align="center">
<a href="https://www.pixiv.net/en/artworks/69208923"><img src="https://github.com/richardscull/RichardsMusicBot/blob/master/images/statusEmbed.png?raw=true" alt="Richard's coffee shop"></a>
  
</h1>
<h4 align="center">🎶 Discord bot for playing music from youtube and spotify <h4>

# 🔧 Requirements

To set up the self-hosted version of the bot, the following are required:

1. Node.js v16.9.0 or higher
2. Discord.js v14

# ⚙️ Setup

To start, clone the git repository and install all required dependencies:

```shell
git clone https://github.com/richardscull/RichardsMusicBot
cd RichardsMusicBot
npm install
```

After that, create and fill in the .env file with the required information:

```env
# Bot information
DISCORD_TOKEN= Discord application token
DISCORD_ID= Discord application ID

# Yours GitHub working branch
GITHUB_BRANCH_URL= #By default is /master

# Spotify client information
SPOTIFY_ID= Spotify client id
SPOTIFY_SECRET= Spotify client secret
SPOTIFY_REFRESH_TOKEN= Spotify client refrsh token
SPOTIFY_MARKET= Spotify client market
```

After that, you can successfully run bot by typing `npm run build:start` or `yarn build:start`!
