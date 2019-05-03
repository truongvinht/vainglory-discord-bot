// bot.js
// main class to run discord bot
// ================

//import
const Discord = require("discord.js");
const http = require("http");
const c = require("./general/constLoader");
const i18n = require('./general/langSupport');
const fm = require('./general/contentFormatter');
const strH = require('./general/stringHelper');
const access = require('./general/accessRightManager');
const colorMng = require('./controllers/messageColorManager');

// VIEW
const helpMsg = require('./View/helpMessage');
const cntMsg = require('./View/counterPickMessage');
const itemMsg = require('./View/itemMessage');
const vgMsg = require('./View/vgMessage');
const cocMsg = require('./View/cocMessage');
const eloMsg = require('./View/eloMessage');
const adminMsg = require('./View/adminMessage');

const vgBase = require('./models/vainglory-base.js');

//counter picker
const cp = require('./controllers/vgCounterPicker');

//elo calculator
const eloCalc = require('./controllers/eloCalculator');

// item command
const itemHandler = require('./controllers/itemHandler');
const gameMode = require('./controllers/gameMode');

//logger
var log = require('loglevel');
log.setLevel('info');
//log.setLevel('debug');

// CONSTANTS

// prefix for commands
const PREFIX = c.prefix();
const VG_TOKEN = c.vgToken();
const COC_TOKEN = c.cocToken();

const bot = new Discord.Client({
    disableEveryone: true
});

// prepare invite code
bot.on("ready", async() => {
    log.info(`# # # # # # # # # #\n${i18n.get('BotReady')} ${bot.user.username}\n# # # # # # # # # #`);
    try {
        
        // show link for inviting
        let link = await bot.generateInvite(["ADMINISTRATOR"]);
        log.info(link);

        //load URL
        eloCalc.initURL(`${c.eloListURL()}`);
        itemHandler.initURL(`${c.itemListURL()}`);
        cp.initURL(`${c.heroesListURL()}`);
        gameMode.initURL(`${c.gameModeListURL()}`);

        //init vainglory API token for the bot
        vgMsg.setToken(VG_TOKEN);
        cocMsg.setToken(COC_TOKEN);

        if (c.playerLink() != "") {
            log.info('Load custom urls configuration: ' + c.playerLink());
        }

        // heroku hack
        if (typeof process.env.HOST != 'undefined') {
            setInterval(function() {
                console.log(`Ping URL http://${process.env.HOST}.herokuapp.com`);
                http.get(`http://${process.env.HOST}.herokuapp.com`);
            }, 1000 * 60 * 10); // every 10 minutes (300000)
        }
    } catch (e) {
        log.error(e.stack);
    }
});

// reactions added
bot.on('messageReactionAdd', (reaction, user) => {

    log.debug("reaction " + reaction._emoji.name + " added");

    //reload content
    if (reaction.count > 1 && reaction.emoji == '🔄') {

        for (var embed of reaction.message.embeds) {
            
            // reload randomizer
            if (colorMng.isRandomizer(embed.hexColor)) {
                cntMsg.reloadRandomizer(reaction.message, embed);
                return;
            } else {
                let index = colorMng.randomizerIndex(embed.hexColor);
                if (index > 0) {
                    if (index == 1) {
                        cntMsg.reloadRoleRandomizer(reaction.message, embed, 'l');
                    } else if (index == 2) {
                        cntMsg.reloadRoleRandomizer(reaction.message, embed,'j');
                    } else {
                        cntMsg.reloadRoleRandomizer(reaction.message, embed,'c');
                    }

                    return;
                }
            }
        }

        vgMsg.reloadContent(reaction.message);
        return;
    }

    // show further match details
    if (reaction.count > 1 && reaction.emoji == 'ℹ') {
        vgMsg.getMatchDetails(reaction.message);
        return;
    }

    // show vg pro data
    if (reaction.count > 1 && reaction.emoji == '🕵') {
        
        var playerName = null;
        var heroName = null;
    
        for (var embed of reaction.message.embeds) {

            if (colorMng.isCounterPick(embed.hexColor)) {
                const fields = embed.fields;

                if (fields.length > 0) {
                    const titleString = "" + fields[0].name;
                    const titleFragments = titleString.split(" ");
                    
                    heroName = titleFragments[0];
                }
            } else {
                playerName = embed.author.name;
            }

            break;
        }

        if (playerName !=null) {
            reaction.message.channel.send(helpMsg.getExternalLinkForPlayer(playerName)).then(message => {
                message.react('🗑');
            });
        }else if (heroName !=null) {
            reaction.message.channel.send(helpMsg.getExternalLinkForHero(heroName)).then(message => {
                message.react('🗑');
            });
        }

        return;
    }

    // show played stats
    if (reaction.count > 1 && reaction.emoji == '📊') {
        vgMsg.getMatchDetailsForPlayer(reaction.message);
        return;
    }

    //remove own message from bot
    if (reaction.emoji == '🗑' && user != reaction.message.author) {
        reaction.message.delete();
        return;
    }

    //show player info
    if (reaction.count > 1 && reaction.emoji == '🗒') {
        vgMsg.requestPlayerForEmoji(reaction.message);
        return;
    }

    //show last match
    if (reaction.count > 1 && reaction.emoji == '⚔') {
        vgMsg.requestMatchForEmoji(reaction.message);
        return;
    }

    //show recent match details 
    if (reaction.count > 1 && reaction.emoji == '🏹') {
        vgMsg.requestRecentMatchTypes(reaction.message);
        return;
    }

    //load mate details
    if (reaction.count > 1 && reaction.emoji == '1⃣') {
        vgMsg.loadMates(reaction.message,1);
        return;
    }

    if (reaction.count > 1 && reaction.emoji == '2⃣') {
        vgMsg.loadMates(reaction.message,2);
        return;
    }
    
    if (reaction.count > 1 && reaction.emoji == '3⃣') {
        vgMsg.loadMates(reaction.message,3);
        return;
    }
    
    if (reaction.count > 1 && reaction.emoji == '4⃣') {
        vgMsg.loadMates(reaction.message,4);
        return;
    }
    
    if (reaction.count > 1 && reaction.emoji == '5⃣') {
        vgMsg.loadMates(reaction.message,5);
        return;
    }
});

// reactions removed
bot.on('messageReactionRemove', (reaction, user) => {
    //reload content
    if (!user.bot && reaction.emoji == '🔄') {
        vgMsg.reloadContent(reaction.message);
        return;
    }
});

// messages
bot.on("message", async message => {

    //ignore own messages
    if (message.author.bot) {
        return;
    }

    //ignore commands without prefix
    if (!message.content.startsWith(PREFIX)) return;

    let messageArray = message.content.split(" ");
    let command = messageArray[0];

    //prevent direct message
    if (message.channel.type === "dm") {
        directMessage(message)
        return;
    }

    //prevent any actions, if bot cannot write
    if (message.member != null) {
        if (!message.channel.permissionsFor(bot.user).has('SEND_MESSAGES')) {
            return;
        }
    }

    // user has role
    var hasRole = false;

    for (var reqRole of c.restriction()) {
        if (message.member.roles.find("name", reqRole)) {
            hasRole = true;
            break;
        }
    }

    console.log(`${new Date()}|${message.channel.name}|${message.author.username}: ${message.content}`);

    // commands with 0 or more parameters
    if (strH.hasCmd(command, `${PREFIX}help`)) {
        let embed = helpMsg.getChannelHelp(PREFIX, message.author.username, hasRole);

        message.channel.send(embed).then(message => {
            message.react('🗑');
        });

        return;
    }

    // commands with 0 or more parameters
    if (strH.hasCmd(command, `${PREFIX}cochelp`)) {
        let embed = helpMsg.getCocHelp(PREFIX, message.author.username);

        message.channel.send(embed).then(message => {
        });

        return;
    }

    // // single item code
    // if (strH.hasCmds(command, [`${PREFIX}vgitem`])) {

    //     if (messageArray.length == 1) {
    //         // show list
    //         itemMsg.showItemWithParam(PREFIX, message, ["", '1', '3']);
    //         itemMsg.showItemWithParam(PREFIX, message, ["", '2', '3']);
    //         itemMsg.showItemWithParam(PREFIX, message, ["", '3', '3']);
    //         itemMsg.showItemWithParam(PREFIX, message, ["", '4', '3']);
    //     } else {
    //         itemMsg.showSingleItem(message);
    //     }
    //     return
    // }

    // // command to show items: ITEM CATEGORY TIER INDEX
    // if (strH.hasCmd(command, `${PREFIX}item`)) {
    //     if (hasRole) {
    //         itemMsg.showItem(PREFIX, message);
    //     } else {
    //         message.channel.send(`'${message.author.username}': ${i18n.get('NoPermissionCommand')}`);
    //     }
    //     return;
    // }

    // if (strH.hasCmd(command, `${PREFIX}itemcount`)) {
    //     message.channel.send(itemMsg.showItemsNumber(message));
    //     return;
    // }

    if (messageArray.length == 1) {
        //hero commands
        if (command.length == 3) {

            var d = new Discord.RichEmbed()
                .setAuthor(message.author.username)
                .setColor(colorMng.getColor(4));

            let cmd = command.substring(1, 3);

            //hero quick name
            let hName = cmd.toLowerCase();
            let heroName = cp.getHeroName(hName);

            let result = cntMsg.getGeneral(heroName);

            if (heroName != null) {
                let result = cp.getCounter(heroName.toLowerCase());
                let resultSupport = cp.getSupport(heroName.toLowerCase());

                if (result != null) {
                    d.setThumbnail(`${c.imageURL()}/${heroName.toLowerCase()}.png`)
                        .addField(`${heroName} ${i18n.get('IsWeakAgainst')}`, result)
                        .addField(`${heroName} ${i18n.get('IsStrongAgainst')}`, resultSupport);
                    
                    message.channel.send(d).then(async function (message) {
                        if (c.heroLink() != "") {
                            await message.react('🕵');
                        }
                    });
                } else {
                    message.channel.send(d.setDescription(`'${heroName}': ${i18n.get('EnteredHeroDoesntExist')}`));
                }
            } else {
                message.channel.send(d.setDescription(`'${hName}': ${i18n.get('EnteredHeroDoesntExist')}`));
            }
            return;
        }

        //elo list
        if (message.content.toLowerCase() === `${PREFIX}elo`) {
            for (var eloItem of eloMsg.getList()) {
                message.channel.send(eloItem);
            }
            return;
        }

        // show heroes list
        if (strH.hasCmds(command, [`${PREFIX}hero`])) {
            message.channel.send(cntMsg.getHeroes().setAuthor(message.author.username));
            return;
        }

        // player details
        if (strH.hasCmds(command, [`${PREFIX}player`, `${PREFIX}p`])) {
            vgMsg.requestPlayerDetailsForMe(message, message.author.username);
            return;
        }

        // recent played heroes
        if (strH.hasCmds(command, [`${PREFIX}recent`, `${PREFIX}r`])) {
            //TODO: needs to be enabled
            message.channel.send(`${i18n.get('DisabledAsk')}`);
            //vgMsg.requestRecentPlayedHeroesForMe(message, message.author.username);
            return;
        }

        // last match
        if (strH.hasCmds(command, [`${PREFIX}match`, `${PREFIX}m`])) {
            //TODO: needs to be enabled
            message.channel.send(`${i18n.get('DisabledAsk')}`);
            //vgMsg.requestMatchForMe(message, message.author.username);
            return;
        }

        // commands with special rights

        //clear chat
        if (strH.hasCmds(command, [`${PREFIX}clear`]) && hasRole) {
            async function clear() {
                //remove clear command (last 50 messages)
                message.delete();
                message.channel.fetchMessages({
                    limit: 50
                }).then(messages => {
                    for (const msg of messages.array()) {
                        msg.delete();
                    }
                }).catch(console.error);;
            }
            clear();
            return;
        }
    }

    // command with parameter
    if (messageArray.length >= 2) {

        let hero = messageArray[1].toLowerCase();

        // counter pick
        if (strH.hasCmds(command, [`${PREFIX}counter`, `${PREFIX}c`])) {
            let d = cntMsg.getQuickCounter(hero).setAuthor(message.author.username);
            message.channel.send(d);
            return;
        }

        // support pick
        if (strH.hasCmds(command, [`${PREFIX}support`, `${PREFIX}s`])) {
            let d = cntMsg.getQuickSupport(hero).setAuthor(message.author.username);
            message.channel.send(d);
            return;
        }

        //show player stats
        if (strH.hasCmds(command, [`${PREFIX}player`, `${PREFIX}p`])) {
            vgMsg.requestPlayerDetails(message, null);
            return;
        }

        // show recent played heroes
        if (strH.hasCmds(command, [`${PREFIX}recent`, `${PREFIX}r`])) {
            //TODO: needs to be enabled
            message.channel.send(`${i18n.get('DisabledAsk')}`);
            //vgMsg.requestRecentPlayedHeroes(message, null);
            return;
        }

        // show game stats
        if (strH.hasCmds(command, [`${PREFIX}game`, `${PREFIX}g`])) {
            //TODO: not implemented yet
            //vgMsg.requestPlayedGame(message);
            return;
        }

        //only allow users with roles
        if (strH.hasCmds(command, [`${PREFIX}match`, `${PREFIX}m`])) {
            //TODO: needs to be enabled
            message.channel.send(`${i18n.get('DisabledAsk')}`);
            //vgMsg.requestMatch(message);
            return;
        }

        //validate player and send message
        if (strH.hasCmds(command, [`${PREFIX}validate`]) && hasRole) {
            let playerName = messageArray[1];
            vgMsg.requestPlayerAndValidate(message, playerName);
            return;
        }

        // randomize hero selection
        if (strH.hasCmds(command, [`${PREFIX}random`, `${PREFIX}?`])) {
            let players = messageArray.slice(1,messageArray.length);
            cntMsg.getRandomizer(message,players);
            return;
        }

        if (strH.hasCmds(command, [`${PREFIX}?l`, `${PREFIX}?laner`])) {
            let player = messageArray[1];
            cntMsg.getRandomizerForRole(message,player,'l');
            return;
        }

        if (strH.hasCmds(command, [`${PREFIX}?j`, `${PREFIX}?jungler`])) {
            let player = messageArray[1];
            cntMsg.getRandomizerForRole(message,player,'j');
            return;
        }

        if (strH.hasCmds(command, [`${PREFIX}?c`, `${PREFIX}?captain`])) {
            let player = messageArray[1];
            cntMsg.getRandomizerForRole(message,player,'c');
            return;
        }

        //elo info for given value
        if (command.toLowerCase() === `${PREFIX}elo`) {
            var d = new Discord.RichEmbed();
            const points = messageArray[1];

            if (points.length > 0) {

                const response = function(score, gameMode) {
                    const info = eloCalc.getResult(score);

                    if (info == null) {
                        message.channel.send(d.setDescription(`${i18n.get('ErrorInvalidElo')}`));
                    } else {
                        //load image from parameter
                        if (c.tierImageURL() != null && c.tierImageURL() != "") {
                            const img = vgBase.convertTier(vgBase.getTier(info.elo));
                            d = d.setThumbnail(`${c.tierImageURL()}/${img}.png?raw=true`);
                        }

                        var gameModeInfo = "";

                        if (gameMode != null) {
                            gameModeInfo = ` (${gameMode})`;
                        }

                        if (info.missing == -1) {
                            message.channel.send(d.addField(`${info.title}${gameModeInfo}`, `${i18n.get('BetterImpossible')}`));
                        } else {
                            const msg = i18n.get(eloCalc.getMessage()).replace("$1", info.missing);
                            message.channel.send(d.addField(`${info.title}${gameModeInfo}`, `${msg}`));
                        }
                    }
                };

                if (isNaN(points)) {
                    //use name to check for elo
                    const callback = function(playerName, player) {
                        if (player == null) {
                            message.channel.send(d.setDescription(`${i18n.get('ErrorInvalidElo')}`));
                        } else {
                            response(Math.max(0, Math.floor(player.rankPoints.ranked)), "3v3");

                            const fiveVfiveElo = Math.floor(player.rankPoints.ranked_5v5);
                            if (fiveVfiveElo >= 0) {
                                d = new Discord.RichEmbed();
                                response(Math.max(0, Math.floor(player.rankPoints.ranked_5v5)), "5v5");
                            }
                        }
                        message.channel.stopTyping();
                    };

                    message.channel.startTyping();
                    vgMsg.requestEloForPlayer(message, points, callback);
                } else {
                    response(points, null);
                }

            } else {
                message.channel.send(d.setDescription(`${i18n.get('NotFound')}`));
            }
            return;
        }

        // commands with special rights

        // //updated item list
        // if (strH.hasCmds(command, [`${PREFIX}update`, `${PREFIX}upates`])) {
        //     if (hasRole) {
        //         itemMsg.showUpdatedItems(hero, message);
        //     } else {
        //         message.channel.send(`'${message.author.username}': ${i18n.get('NoPermissionCommand')}`);
        //     }
        //     return
        // }

        //information
        if (strH.hasCmds(command, [`${PREFIX}info`, `${PREFIX}i`])) {
            if (hasRole) {
                vgMsg.getFullPlayerDetails(message, messageArray[1]);
                return;
            } else {
                message.channel.send(`'${message.author.username}': ${i18n.get('NoPermissionCommand')}`);
            }
            return;
        }

        if (strH.hasCmds(command, [`${PREFIX}clan`])) { 
            let clantag = messageArray[1];
            cocMsg.getClan(message,clantag);
            return;
        }

        if (strH.hasCmds(command, [`${PREFIX}clans`,`${PREFIX}clansuche`])) { 

            let clanName = messageArray[1];
            cocMsg.findClan(message,clanName);
            return;
        }

        if (strH.hasCmds(command, [`${PREFIX}clasher`,`${PREFIX}mitglied`,`${PREFIX}claner`])) { 
            let tag = messageArray[1];
            cocMsg.findMember(message,tag);
            return;
        }

        if (strH.hasCmds(command, [`${PREFIX}cwl`])) { 
            var clanTag = messageArray[1];
            cocMsg.getCWL(message,clanTag);
            return;
        }
    }
});

// method to get bot channel
function findChannelByName(channelName) {
    for (var channel of bot.channels.array()) {
        // only text channel 
        if (channel.type == "text") {
            if (channelName === channel.name) {
                return channel;
            }
        }
    }
    return null;
}

function directMessage(message) {

    let messageArray = message.content.split(" ");
    let command = messageArray[0];

    if (strH.hasCmd(command, `${PREFIX}help`)) {
        let embed = helpMsg.getDmHelp(PREFIX, message.author.username);
        message.channel.send(embed);
    }

    // reload remote plist content
    if (strH.hasCmd(command, `${PREFIX}reloadall`)) {

        //reload elo list
        eloCalc.reload();

        //reload item list
        itemHandler.reload();

        //reload counter pick data
        cp.reload();

        //reload game mode
        gameMode.reload();

        return;
    }

    if (messageArray.length == 1) {
        // last match
        if (strH.hasCmds(command, [`${PREFIX}match`, `${PREFIX}m`])) {
            vgMsg.requestMatchForMe(message, message.author.username);
            return;
        }
    } else {
        //only allow users with roles
        if (strH.hasCmds(command, [`${PREFIX}match`, `${PREFIX}m`])) {
            vgMsg.requestMatch(message);
            return;
        }
    }
    

    //server and channel information
    if (strH.hasCmd(command, `${PREFIX}whereami`)) {
        let embed = adminMsg.getServerInfo(bot);
        message.channel.send(embed);
        return;
    }

    if (strH.hasCmd(command, `${PREFIX}whatdoisee`)) {
        let embed = adminMsg.getBotDetails(bot);
        message.channel.send(embed);
        return;
    }

    // send message to a target channel
    if (strH.hasCmd(command, `${PREFIX}msg`)) {
        if (messageArray.length <= 2) {
            return;
        }

        let channel = findChannelByName(messageArray[1]);
        let permission = access.hasAccess(channel, message.author.username);

        if (permission) {
            channel.send(message.content.substring(
                messageArray[0].length + messageArray[1].length + 2, message.content.length));
        } else {
            message.channel.send(`${i18n.get('NoPermissionCommand')}`);
        }
        return;
    }

    //feature to fetch player afk status
    if (strH.hasCmds(command, [`${PREFIX}afk`])) {
        var list = message.content.replace(/(?:\r\n|\r|\n)/g, " ").split(" ");
        list = list.slice(1, list.length);
        vgMsg.afkInfo(list, message.channel);
        return;
    }

    //feature to fetch player uuids
    if (strH.hasCmds(command, [`${PREFIX}uuid`])) {
        var list = message.content.replace(/(?:\r\n|\r|\n)/g, " ").split(" ");
        list = list.slice(1, list.length);
        vgMsg.uuidInfo(list, message.channel);
        return;
    }

    //find player by uuid
    if (strH.hasCmds(command, [`${PREFIX}find`])) {

        const cb = function(d, uuid) {
            message.channel.send(`${i18n.get('ErrorPlayerIdNotFound')}`);
        }

        vgMsg.requestPlayerDetailsByUuid(message, cb);
        return;
    }


    // commands
    if (strH.hasCmd(command, `${PREFIX}coc`)) {
        let token = messageArray[1];
        cocMsg.setToken(token);
        message.channel.send("Clash Token aktualisiert.");
        return;
    }

    // commands
    if (strH.hasCmd(command, `${PREFIX}cmd`)) {
        if (messageArray.length <= 2) {
            return;
        }
        let channel = findChannelByName(messageArray[1]);
        let permission = access.hasAccess(channel, message.author.username);

        if (permission) {
            //execute command into channel
            let subCommand = messageArray[2];

            //player command
            if (strH.hasCmd(subCommand, `${PREFIX}player`) && messageArray.length > 3) {
                let playerName = messageArray[3];
                vgMsg.requestPlayerDetailsInChannel(channel, playerName, messageArray.length > 4 ? messageArray[4] : null);
                return;
            }

            // help command
            if (strH.hasCmd(subCommand, `${PREFIX}help`)) {
                let embed = helpMsg.getChannelHelp(PREFIX, bot.user.username, false);
                channel.send(embed);
                return;
            }

            // hero command
            if (subCommand.length == 3) {

                var d = new Discord.RichEmbed()
                    .setAuthor(bot.user.username)
                    .setColor(colorMng.getColor(4));

                let cmd = subCommand.substring(1, 3);

                //hero quick name
                let hName = cmd.toLowerCase();
                let heroName = cp.getHeroName(hName);

                let result = cntMsg.getGeneral(heroName);

                if (heroName != null) {
                    let result = cp.getCounter(heroName.toLowerCase());
                    let resultSupport = cp.getSupport(heroName.toLowerCase());

                    if (result != null) {
                        channel.send(
                            d.setThumbnail(`${c.imageURL()}/${heroName.toLowerCase()}.png`)
                            .addField(`${heroName} ${i18n.get('IsWeakAgainst')}`, result)
                            .addField(`${heroName} ${i18n.get('IsStrongAgainst')}`, resultSupport));
                    } else {
                        message.channel.send(d.setDescription(`'${heroName}': ${i18n.get('EnteredHeroDoesntExist')}`));
                    }
                } else {
                    message.channel.send(d.setDescription(`'${hName}': ${i18n.get('EnteredHeroDoesntExist')}`));
                }
            }
        } else {
            message.channel.send(`${i18n.get('NoPermissionCommand')}`);
        }
    }
}

// login bot into discord
if (!(c.botToken() == null || c.botToken().length == 0)) {
    bot.login(c.botToken());
} else {
    log.error('Invalid Discord Token')
}