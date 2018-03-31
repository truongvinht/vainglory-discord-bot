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

optional adjustment:
- prefix: Command to listen
- imageURL: Url for getting images like heroes / items / tier
- restricted: user with this tag has special permission
- ELO_LIST_URL: url to json file with elo scoring


#### Note
Discord invitation link will be displayed within the command line.

# License
MIT License (MIT)
