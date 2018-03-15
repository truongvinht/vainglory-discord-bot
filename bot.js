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

// VIEW
const helpMsg = require('./View/helpMessage');
const cntMsg = require('./View/counterPickMessage');
const itemMsg = require('./View/itemMessage');
const vgMsg = require('./View/vgMessage');
const eloMsg = require('./View/eloMessage');

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
    if (reaction.count > 1 && reaction.emoji == 'ℹ') {
        vgMsg.getMatchDetails(reaction.message);
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
        
        if (strH.hasCmd(command,`${PREFIX}help`)) {
            let embed = helpMsg.getDmHelp(PREFIX,message.author.username);
            message.channel.send(embed);
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
                }
                
                // hero command
                if (subCommand.length == 3) {

                    var d = new Discord.RichEmbed()
                        .setAuthor(bot.user.username)
                        .setColor("#123456");

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
                    return;
                }
                
            }else {
                message.channel.send(`${i18n.get('NoPermissionCommand')}`);
            }
            return;
        }

        return;
    }
    
    console.log(`${new Date()}|${message.channel.name}|${message.author.username}: ${message.content}`);
    

    // user has role
    var hasRole = false;

    for (var reqRole of c.restriction()) {
        if (message.member.roles.find("name", reqRole)) {
            hasRole = true;
            break;
        }
    }
    
    //HELP
    if (strH.hasCmd(command,`${PREFIX}help`)) {
        let embed = helpMsg.getChannelHelp(PREFIX,message.author.username, hasRole);
        message.channel.send(embed);
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
                .setColor("#123456");

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
    }

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
        
        //only allow users with roles
        if (strH.hasCmds(command,[`${PREFIX}match`,`${PREFIX}m`])) {
            vgMsg.requestMatch(message);
            return;
        }

        // show recent played heroes
        if (strH.hasCmds(command,[`${PREFIX}recent`,`${PREFIX}r`])) {
            vgMsg.requestRecentPlayedHeroes(message, null);
            return;
        }
        
        //elo info for given value
        if (command.toLowerCase() === `${PREFIX}elo`) {
            var points = messageArray[1];
            var d = new Discord.RichEmbed();
            
            if (points.length > 0) {
                var info = eloCalc.getResult(points);

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
            } else {
                message.channel.send(d.setDescription(`${i18n.get('NotFound')}`));
            }
        }

        //show player stats
        if (strH.hasCmds(command,[`${PREFIX}player`,`${PREFIX}p`])) {
            vgMsg.requestPlayerDetails(message, null);
        }
        
        //information
        if (strH.hasCmds(command,[`${PREFIX}info`,`${PREFIX}i`])) {
            if (hasRole) {
            const callbackRecentHeroes = function(message, playerName) {
                const callbackMatch = function(message, playerName) {
                    if (hasRole) {
                        vgMsg.requestMatch(message);
                    }
                }
                vgMsg.requestRecentPlayedHeroes(message, callbackMatch);
            }
            vgMsg.requestPlayerDetails(message, callbackRecentHeroes);
            } else {
                message.channel.send(`'${message.author.username}': ${i18n.get('NoPermissionCommand')}`);
            }
        }

        //hidden feature to fetch player IDs
        if (strH.hasCmds(command,[`${PREFIX}afk`])) {
            if (hasRole) {
                var list = messageArray.slice(1, messageArray.length);
                vgMsg.afkInfo(list, message.channel);
            } else {
                message.channel.send(`'${message.author.username}': ${i18n.get('NoPermissionCommand')}`);
            }
        }

    } else {
        // show heroes list
        if (strH.hasCmds(command,[`${PREFIX}hero`])) {
            message.channel.send(cntMsg.getHeroes().setAuthor(message.author.username));
        } else if (command === `${PREFIX}clear` && hasRole) {
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
        } else if (strH.hasCmds(command,[`${PREFIX}about`])) {

            var d = new Discord.RichEmbed()
                .setAuthor(message.author.username);
            
            const version = c.version();

            message.channel.send(d.addField(`${i18n.get('AboutBot')} [${version}]`, `Creator: ${c.author()}`));
        } else if (strH.hasCmds(command,[`${PREFIX}info`,`${PREFIX}i`])) {
            if (hasRole) {
                const callbackRecentHeroes = function(message, playerName) {
                    const callbackMatch = function(message, playerName) {
                        if (hasRole) {
                            vgMsg.requestMatchForPlayer(message, playerName);
                        }
                    }
                    vgMsg.requestRecentPlayedHeroesForName(message, playerName, callbackMatch);
                }
                vgMsg.requestPlayerDetailsForName(message,message.author.username ,callbackRecentHeroes);
            } else {
                message.channel.send(`'${message.author.username}': ${i18n.get('NoPermissionCommand')}`);
            }
            return;
        } else if (strH.hasCmds(command,[`${PREFIX}recent`,`${PREFIX}r`])){
            vgMsg.requestRecentPlayedHeroesForName(message,message.author.username);
        }
        else if (strH.hasCmds(command,[`${PREFIX}match`,`${PREFIX}m`])) {
            vgMsg.requestMatchForPlayer(message,message.author.username);
            return;
        }else if (strH.hasCmds(command,[`${PREFIX}player`,`${PREFIX}p`])) {
            vgMsg.requestPlayerDetailsForName(message,message.author.username,null);
        } else {
            var d = new Discord.RichEmbed();
            const helpdestails = i18n.get(`HelpDetails`).replace("$1",`${PREFIX}`)
            message.channel.send(d.addField(`${i18n.get('Help')}`, `${helpdestails}`));
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

// login bot into discord
if (!(c.botToken() == null || c.botToken().length == 0)) {
    bot.login(c.botToken());
} else {
    log.error('Invalid Discord Token')
}