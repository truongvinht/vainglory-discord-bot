# vainglory-discord-bot

A Vainglory Discord Bot for displaying counter picks for given hero. 

## Requirement
- Discord Server (Token)
- Server for deploying bot (NPM/NodeJs)

## Guide
In order to launch the bot you need to first visit https://discordapp.com/developers/applications/ to create an app for a discord token.
This token needs to be set within the botsettings.json.
In the last step you run the bot by typing
```Bash
node bot
```

#### Configuration
Copy config/example_settings.json to config/settings.json and fill in your discord bot token and the vainglory api token. 

mandatory arguments:
- token: Discord API Token
- prefix: Prefix for triggering bot
- lang: language (currently only de or en)
- vgAPIToken: Vainglory API token

optional adjustment:
- prefix: Command to listen
- imageURL: Url for getting images like heroes / items / tier
- restricted: user with this tag has special permission
- DATA_URL: url to folder containing following configurations: gameMode.json, heroes.json, itemsDescription.json, numerical_vst.json (see https://github.com/truongvinht/vainglory-raw-assets for samples)


#### Note
Discord invitation link will be displayed within the command line.

# License
MIT License (MIT)
