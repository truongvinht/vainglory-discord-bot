// bot.js
// main class to run discord bot
// ================

//import
const Discord = require("discord.js");
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
const eloMsg = require('./View/eloMessage');
const adminMsg = require('./View/adminMessage');

const vgBase = require('./models/vainglory-base.js');

//counter picker
const cp = require('./controllers/vgCounterPicker');

//elo calculator
const eloCalc = require('./controllers/eloCalculator');

//logger
var log =require('loglevel');
log.setLevel('info');

// CONSTANTS

// prefix for commands
const PREFIX = c.prefix();
const VG_TOKEN = c.vgToken();

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
        
        //init vainglory API token for the bot
        vgMsg.setToken(VG_TOKEN);
    } catch (e) {
        log.error(e.stack);
    }
});

// reactions added
bot.on('messageReactionAdd', (reaction, user) => {
    
    //reload content
    if (reaction.count > 1 && reaction.emoji == '🔄') {
        vgMsg.reloadContent(reaction.message);
        return;
    }
    
    // show further match details
    if (reaction.count > 1 && reaction.emoji == 'ℹ') {
        vgMsg.getMatchDetails(reaction.message);
        return;
    }
    
    //remove own message from bot
    if (reaction.emoji == '🗑' && user != reaction.message.author) {
        reaction.message.delete();
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
    if (message.channel.type === "dm"){ 
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
    
    //HELP
    if (strH.hasCmd(command,`${PREFIX}help`)) {
        let embed = helpMsg.getChannelHelp(PREFIX,message.author.username, hasRole);
        
        message.channel.send(embed).then(message => {
            message.react('🗑');
        });
        
        return;
    }
    
    // command to show items: ITEM CATEGORY TIER INDEX
    if (strH.hasCmd(command,`${PREFIX}item`)) {
        if (hasRole) {
            itemMsg.showItem(PREFIX, message);
        } else {
            message.channel.send(`'${message.author.username}': ${i18n.get('NoPermissionCommand')}`);
        }
        return;
    }

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
                    message.channel.send( 
                        d.setThumbnail(`${c.imageURL()}/${heroName.toLowerCase()}.png`)
                        .addField(`${heroName} ${i18n.get('IsWeakAgainst')}`, result)
                        .addField(`${heroName} ${i18n.get('IsStrongAgainst')}`, resultSupport));
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
        if (strH.hasCmds(command,[`${PREFIX}hero`])) {
            message.channel.send(cntMsg.getHeroes().setAuthor(message.author.username));
            return;
        }
        
        // about
        if (strH.hasCmds(command,[`${PREFIX}about`])) {

            var d = new Discord.RichEmbed()
                    .setAuthor(message.author.username);
            
            const version = c.version();
            message.channel.send(d.addField(`${i18n.get('AboutBot')} [${version}]`, `Creator: ${c.author()}`));
            return;
        }
        
        // player details
        if (strH.hasCmds(command,[`${PREFIX}player`,`${PREFIX}p`])) {
            vgMsg.requestPlayerDetailsForMe(message,message.author.username);
            return;
        }
        
        // recent played heroes
        if (strH.hasCmds(command,[`${PREFIX}recent`,`${PREFIX}r`])){
            vgMsg.requestRecentPlayedHeroesForMe(message,message.author.username);
            return;
        }
        
        // last match
        if (strH.hasCmds(command,[`${PREFIX}match`,`${PREFIX}m`])) {
            vgMsg.requestMatchForMe(message,message.author.username);
            return;
        }
        
        
        // commands with special rights
        
        //clear chat
        if (strH.hasCmds(command,[`${PREFIX}clear`]) && hasRole) {
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
        
        // p + r + m command
        if (strH.hasCmds(command,[`${PREFIX}info`,`${PREFIX}i`])) {
            
            if (hasRole) {
                vgMsg.getFullPlayerDetails(message,message.author.username);
            } else {
                message.channel.send(`'${message.author.username}': ${i18n.get('NoPermissionCommand')}`);
            }
            return;
        } 
    }
    
    // command with parameter
    if (messageArray.length >= 2) {

        let hero = messageArray[1].toLowerCase();

        // counter pick
        if (strH.hasCmd(command,`${PREFIX}counter`)) {
            let d = cntMsg.getCounter(hero).setAuthor(message.author.username);
            message.channel.send(d);
            return;
        }

        // quick counter pick
        if (strH.hasCmd(command,`${PREFIX}c`)) {
            let d = cntMsg.getQuickCounter(hero).setAuthor(message.author.username);
            message.channel.send(d);
            return;
        }

        // support pick
        if (strH.hasCmd(command,`${PREFIX}support`)) {
            let d = cntMsg.getSupport(hero).setAuthor(message.author.username);
            message.channel.send(d);
            return;
        }

        // quick support pick
        if (strH.hasCmd(command,`${PREFIX}s`)) {
            let d = cntMsg.getQuickSupport(hero).setAuthor(message.author.username);
            message.channel.send(d);
            return;
        }
        
        //show player stats
        if (strH.hasCmds(command,[`${PREFIX}player`,`${PREFIX}p`])) {
            vgMsg.requestPlayerDetails(message, null);
        }

        // show recent played heroes
        if (strH.hasCmds(command,[`${PREFIX}recent`,`${PREFIX}r`])) {
            vgMsg.requestRecentPlayedHeroes(message, null);
            return;
        }
        
        //only allow users with roles
        if (strH.hasCmds(command,[`${PREFIX}match`,`${PREFIX}m`])) {
            vgMsg.requestMatch(message);
            return;
        }
        
        //elo info for given value
        if (command.toLowerCase() === `${PREFIX}elo`) {
            var d = new Discord.RichEmbed();
            const points = messageArray[1];
            
            if (points.length > 0) {
                
                const response = function(score) {
                    const info = eloCalc.getResult(score);

                    if (info == null) {
                        message.channel.send(d.setDescription(`${i18n.get('ErrorInvalidElo')}`));
                    } else {
                        //load image from parameter
                        if (c.tierImageURL()!=null && c.tierImageURL()!="") {
                            const img = vgBase.convertTier(vgBase.getTier(info.elo));
                             d = d.setThumbnail(`${c.tierImageURL()}/${img}.png?raw=true`);
                        }
                    
                        if (info.missing == -1) {
                            message.channel.send(d.addField(`${info.title}`, `${i18n.get('BetterImpossible')}`));
                        } else {
                            const msg = i18n.get(eloCalc.getMessage()).replace("$1",info.missing);
                            message.channel.send(d.addField(`${info.title}`, `${msg}`));
                        }
                    }
                };
                
                if (isNaN(points)) {
                    //use name to check for elo
                    const callback = function(playerName, player) {
                        if (player == null) {
                            message.channel.send(d.setDescription(`${i18n.get('ErrorInvalidElo')}`));
                        } else {
                            response(Math.floor(player.rankPoints.ranked));
                        }
                        message.channel.stopTyping();
                    };

                    message.channel.startTyping();
                    vgMsg.requestEloForPlayer(message, points, callback);
                } else {
                    response(points);
                }
                
            } else {
                message.channel.send(d.setDescription(`${i18n.get('NotFound')}`));
            }
            return;
        }
        
        // single item code
        if (strH.hasCmds(command,[`${PREFIX}vgitem`])) {
            itemMsg.showSingleItem(message);
            return
        }
        
        // commands with special rights

        //updated item list
        if (strH.hasCmds(command,[`${PREFIX}updateditems`,`${PREFIX}uitems`])) {
            if (hasRole) {
                itemMsg.showUpdatedItems(hero,message);
            } else {
                message.channel.send(`'${message.author.username}': ${i18n.get('NoPermissionCommand')}`);
            }
            return
        }
        
        //information
        if (strH.hasCmds(command,[`${PREFIX}info`,`${PREFIX}i`])) {
            if (hasRole) {
                vgMsg.getFullPlayerDetails(message,messageArray[1]);
                return;
            } else {
                message.channel.send(`'${message.author.username}': ${i18n.get('NoPermissionCommand')}`);
            }
            return;
        }

        //hidden feature to fetch player IDs
        if (strH.hasCmds(command,[`${PREFIX}afk`])) {
            if (hasRole) {
                var list = message.content.replace(/(?:\r\n|\r|\n)/g, " " ).split( " " );
                list = list.slice(1, list.length);
                vgMsg.afkInfo(list, message.channel);
            } else {
                message.channel.send(`'${message.author.username}': ${i18n.get('NoPermissionCommand')}`);
            }
            return;
        }
    }
    
    //unknown command
    var d = new Discord.RichEmbed();
    const helpdestails = i18n.get(`HelpDetails`).replace("$1",`${PREFIX}`)
    message.channel.send(d.addField(`${i18n.get('Help')}`, `${helpdestails}`));
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
    
    if (strH.hasCmd(command,`${PREFIX}help`)) {
        let embed = helpMsg.getDmHelp(PREFIX,message.author.username);
        message.channel.send(embed);
    }
    
    //server and channel information
    if (strH.hasCmd(command,`${PREFIX}whereami`)) {
        let embed = adminMsg.getServerInfo(bot,message);
        message.channel.send(embed);
        return;
    }

    // send message to a target channel
    if (strH.hasCmd(command,`${PREFIX}msg`)) {
        if(messageArray.length <= 2){
            return;
        }
        
        let channel = findChannelByName(messageArray[1]);
        let permission = access.hasAccess(channel, message.author.username);
        
        if (permission) {
            channel.send(message.content.substring(
                messageArray[0].length + messageArray[1].length + 2, message.content.length));
        }else {
            message.channel.send(`${i18n.get('NoPermissionCommand')}`);
        }
        return;
    }
    
    // commands
    if (strH.hasCmd(command,`${PREFIX}cmd`)) {
        if(messageArray.length <= 2){
            return;
        }
        let channel = findChannelByName(messageArray[1]);
        let permission = access.hasAccess(channel, message.author.username);
        
        if (permission) {
            //execute command into channel
            let subCommand = messageArray[2];
            
            //player command
            if (strH.hasCmd(subCommand,`${PREFIX}player`) && messageArray.length > 3) {
                let playerName = messageArray[3];
                vgMsg.requestPlayerDetailsInChannel(channel,playerName,messageArray.length > 4? messageArray[4]: null);
                return;
            }
            
            // help command
            if (strH.hasCmd(subCommand,`${PREFIX}help`)) {
                let embed = helpMsg.getChannelHelp(PREFIX,bot.user.username, false);
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
        }else {
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