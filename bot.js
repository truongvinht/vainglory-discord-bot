// bot.js
// main class to run discord bot
// ================

//import
const Discord = require("discord.js");
const c = require("./controllers/constLoader");
const i18n = require('./controllers/langSupport');
const vgBase = require('./models/vainglory-base');
var vg = require('./controllers/vainglory-req');

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
        let link = await bot.generateInvite(["ADMINISTRATOR"]);
        log.info(link);
        
        //load URL
        eloCalc.initURL(`${c.eloListURL()}`);
    } catch (e) {
        log.error(e.stack);
    }
});


// reaction for message
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

        // send message to a target channel
        if (command.toLowerCase() === `${PREFIX}msg`) {
            if(messageArray.length <= 2){
                return;
            }

            for (var channel of bot.channels.array()) {

                //text channel with name
                if (channel.type == "text") {
                    if (messageArray[1] === channel.name) {
                        
                        //check whether triggered user has special rights
                        for(var guildMember of channel.members.array()) {
                            
                            if (message.author.username === guildMember.user.username) {
                                
                                // user has permission
                                var permission = false;
                                
                                for (var reqRole of c.restriction()) {
                                    if (guildMember.roles.find("name", reqRole)) {
                                        permission = true;
                                        break;
                                    }
                                }
                                
                                if (permission) {
                                    channel.send(message.content.substring(
                                        messageArray[0].length + messageArray[1].length + 2, message.content.length));
                                } else {
                                    message.channel.send(`${i18n.get('NoPermissionCommand')}`);
                                }
                            }
                        }
                        break;
                    }
                }
            }
            return;
        }
        
        // channel access overview
        // if (command.toLowerCase() === `${PREFIX}chan`) {
        //     let embed = new Discord.RichEmbed();
        //
        //     for (var c of bot.channels.array()) {
        //     }
        //     message.channel.send()
        // }

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
    if (command === `${PREFIX}help`) {
        let embed = new Discord.RichEmbed()
            .setAuthor(message.author.username)
            .setDescription(`${i18n.get('FollowingCommands')}`)
            .addField(`${PREFIX}about`, `${i18n.get('AboutBot')}`)
            .addField(`${PREFIX}counter HERO`, `${i18n.get('DisplayWeaknessHero')}`)
            .addField(`${PREFIX}support HERO`, `${i18n.get('DisplayStrengthHero')}`)
            .addField(`${PREFIX}HERO-CODE`, `${i18n.get('DisplayInfoHeroCode')}`)
            .addField(`${PREFIX}hero`, `${i18n.get('DisplayListHero')}`)
            .addField(`${PREFIX}player ${i18n.get('Player')} [server]`, `${i18n.get('HelpPlayerDetails')}`)
            .addField(`${PREFIX}recent ${i18n.get('Player')} [server]`, `${i18n.get('RecentHeroes')}`)
            .addField(`${PREFIX}info ${i18n.get('Player')}`, `${i18n.get('HelpPlayerDetailsFull')}`)
            .addField(`${PREFIX}elo ELO`, `${i18n.get('EloDetails')}`)
            .addField(`${PREFIX}match ${i18n.get('Player')} [server]`, `${i18n.get('LastMatchDetails')}`);

        if (hasRole) {
            embed.addField(`${PREFIX}afk ${i18n.get('Player')} [server]`, `${i18n.get('AfkInfo')}`);
            embed.addField(`${PREFIX}clear`, `${i18n.get('ClearCmd')}`);
        }
        message.channel.send(embed);
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

            let result = getGeneralInfo(heroName);

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
            var d = new Discord.RichEmbed();
            
            const MAX_SPLIT = 20;
            
            for (var i=0;i<MAX_SPLIT;i++) {
                 const info = eloCalc.getScore(i);
                 d = d.addField(`${info.title}`, `${info.starts} - ${info.ends}`);
            }
            message.channel.send(d); 

            d = new Discord.RichEmbed();
            for (var i=MAX_SPLIT;i<30;i++) {
                 const info = eloCalc.getScore(i);
                 d = d.addField(`${info.title}`, `${info.starts} - ${info.ends}`);
            }
            message.channel.send(d);
            return;
        }
    }

    if (messageArray.length >= 2) {

        let hero = messageArray[1].toLowerCase();

        // counter pick
        if (command === `${PREFIX}counter`) {
            var d = new Discord.RichEmbed()
                .setAuthor(message.author.username)
                .setColor("#ff0000");
            sendCounter(message,d, hero);
        }

        // quick counter pick
        if (command.toLowerCase() === `${PREFIX}c`) {

            var d = new Discord.RichEmbed()
                .setAuthor(message.author.username)
                .setColor("#ff0000");

            //hero quick name
            let hName = messageArray[1].toLowerCase();
            let heroName = cp.getHeroName(hName);

            if (heroName != null) {
                sendCounter(message,d, heroName);
            } else {
                message.channel.send(new Discord.RichEmbed()
                    .setAuthor(message.author.username)
                    .setDescription(`'${hName}': ${i18n.get('InvalidHeroCode')}`));
            }
        }

        // support pick
        if (command === `${PREFIX}support`) {
            var d = new Discord.RichEmbed()
                .setAuthor(message.author.username)
                .setColor("#008000");
            sendSupport(message,d, hero);
        }

        // quick support pick
        if (command.toLowerCase() === `${PREFIX}s`) {

            var d = new Discord.RichEmbed()
                .setAuthor(message.author.username)
                .setColor("#008000");

            //hero quick name
            let hName = messageArray[1].toLowerCase();
            let heroName = cp.getHeroName(hName);

            if (heroName != null) {
                sendSupport(message,d, heroName);
            } else {
                message.channel.send(new Discord.RichEmbed()
                    .setAuthor(message.author.username)
                    .setDescription(`'${heroName}': ${i18n.get('InvalidHeroCode')}`));
            }
        }
        
        //only allow users with roles
        if (command.toLowerCase() === `${PREFIX}match` || command.toLowerCase() === `${PREFIX}m`) {
            requestMatch(message);
        }

        // show recent played heroes
        if (command.toLowerCase() === `${PREFIX}recent` || command.toLowerCase() === `${PREFIX}r`) {
            requestRecentPlayedHeroes(message, null);
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
                        message.channel.send(d.addField(`${info.title}`, `${randomTierMessage(info.missing)}`));
                    }
                }
            } else {
                message.channel.send(d.setDescription(`${i18n.get('NotFound')}`));
            }
        }

        //show player stats
        if (command.toLowerCase() === `${PREFIX}player` || command.toLowerCase() === `${PREFIX}p`) {
            requestPlayerDetails(message, null);
        }
        
        //information
        if (command.toLowerCase() === `${PREFIX}info` || command.toLowerCase() === `${PREFIX}i`) {
            
            const callbackRecentHeroes = function(message, playerName) {
                const callbackMatch = function(message, playerName) {
                    if (hasRole) {
                        requestMatch(message);
                    }
                }
                requestRecentPlayedHeroes(message, callbackMatch);
            }
            requestPlayerDetails(message, callbackRecentHeroes);
        }

        //hidden feature to fetch player IDs
        if (command.toLowerCase() === `${PREFIX}afk`) {
            if (hasRole) {
                var list = messageArray.slice(1, messageArray.length);
                var callback = function(content) {
                    var d = new Discord.RichEmbed().setColor("#FFFFFF");

                    if (content != null) {
                        for (var p of content) {
                            //${p.id}
                            var diff = dateDiff(new Date(p.createdAt));
                            d = d.addField(`${p.name}`, `Last active: ${p.createdAt}\n${diff['days']} d ${diff['hours']} h ${diff['minutes']} m `);
                        }
                        message.channel.send(d);
                    } else {
                        message.channel.send(d.setDescription(`'${list}' ${i18n.get('NotFound')}`).setColor("#FFD700"));
                    }
                    return;
                }

                vg.setToken(VG_TOKEN);
                
                const code = messageArray.length === 3?messageArray[2]:null;
                const serverCode = c.vgServerCode(code);
                
                //needs to figure out for more than 6 ids
                vg.getPlayersInfo(serverCode, list, callback);
            } else {
                message.channel.send(`'${message.author.username}': ${i18n.get('NoPermissionCommand')}`);
            }
        }

    } else {
        // show heroes list
        if (command === `${PREFIX}hero`) {

            var d = new Discord.RichEmbed()
                .setAuthor(message.author.username);

            let keyValueMap = cp.getHeroes();
            message.channel.send(d.addField(keyValueMap.title, keyValueMap.content));
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
        } else if (command.toLowerCase() === `${PREFIX}about`) {

            var d = new Discord.RichEmbed()
                .setAuthor(message.author.username);
            
            const version = c.version();

            message.channel.send(d.addField(`${i18n.get('AboutBot')} [${version}]`, `Creator: ${c.author()}`));
        } else if (command.toLowerCase() === `${PREFIX}i` || command.toLowerCase() === `${PREFIX}info`) {
            const callbackRecentHeroes = function(message, playerName) {
                const callbackMatch = function(message, playerName) {
                    if (hasRole) {
                        requestMatchForPlayer(message, playerName);
                    }
                }
                requestRecentPlayedHeroesForName(message, playerName, callbackMatch);
            }
            requestPlayerDetailsForName(message,message.author.username ,callbackRecentHeroes);
            return;
        }else if(command.toLowerCase() === `${PREFIX}m` || command.toLowerCase() === `${PREFIX}match`) {
            requestMatchForPlayer(message,message.author.username);
            return;
        }else if(command.toLowerCase() === `${PREFIX}p` || command.toLowerCase() === `${PREFIX}player`) {
            requestPlayerDetailsForName(message,message.author.username,null);
        } else {
            var d = new Discord.RichEmbed();
            const helpdestails = i18n.get(`HelpDetails`).replace("$1",`${PREFIX}`)
            message.channel.send(d.addField(`${i18n.get('Help')}`, `${helpdestails}`));
        }
    }
});

function requestPlayerDetails(message, nextCaller){
    
    const messageArray = message.content.split(" ");
    
    var playerName = messageArray[1];

    if (playerName.length == 0) {
        playerName = messageArray[countSpaces(message.content)];
    }
    requestPlayerDetailsForName(message, playerName, nextCaller);
}

function requestPlayerDetailsForName(message, playerName, nextCaller) {
    
    message.channel.startTyping();
    
    //override default server
    const messageArray = message.content.split(" ");
    const code = messageArray.length === 2?messageArray[1]:null;
    const serverCode = c.vgServerCode(code);

    var callback = function(playerName, player) {

        var d = new Discord.RichEmbed();

        if (player != null) {
            d = d.addField(`${i18n.get('Level')} (${i18n.get('XP')})`, `${player.level} (${player.xp})`)
                .addField(`${i18n.get('Skilltier')}`, `${player.skillTier}`)
                .setColor(getClassColor(`${player.skillTier}`));

            if (player.guildTag != "") {
                d = d.addField(`${i18n.get('GuildTag')}`, `${player.guildTag}`);
            }
            
            //load image from parameter
            if (c.tierImageURL()!=null && c.tierImageURL()!="") {
                 d = d.setThumbnail(`${c.tierImageURL()}/${player.skillTierImg}.png?raw=true`);
            }
            
            const gamesPlayedContent =  `Casual 5v5: ${player.gamesPlayed.casual_5v5}\n` +
                                      `Casual 3v3: ${player.gamesPlayed.casual}\n` +
                                      `Ranked: ${player.gamesPlayed.ranked}\n` + 
                                      `Blitz: ${player.gamesPlayed.blitz}\n` +
                                      `Battle Royal: ${player.gamesPlayed.aral}`;
            
            d = d.addField(`${i18n.get('RankPoints')}`, `Blitz: ${player.rankPoints.blitz}\nRanked: ${player.rankPoints.ranked}`)
                .addField(`${i18n.get('GamesPlayed')}`, `${gamesPlayedContent}`)
                .addField(`${i18n.get('Karma')}`, `${vgBase.getKarma(player.karmaLevel)}`)
                .addField(`${i18n.get('Victory')}`, `${player.wins}`)
                .addField(`${i18n.get('LastActive')}`, `${player.createdAt}`)
            message.channel.send(d.setAuthor(`${player.name}`));
            
            if (nextCaller !=null) {
                message.channel.stopTyping();
                nextCaller(message,playerName);
            }
        } else {
            message.channel.send(d.setDescription(`'${playerName}' ${i18n.get('NotFound')}`).setColor("#FFD700"));
        }
    
        message.channel.stopTyping();
    };
    vg.setToken(VG_TOKEN);
    vg.getPlayerStats(serverCode, playerName, callback);
}

function requestRecentPlayedHeroes(message, nextCaller) {
    
    const messageArray = message.content.split(" ");
    
    var playerName = messageArray[1];

    if (playerName.length == 0) {
        playerName = messageArray[countSpaces(message.content)];
    }
    requestRecentPlayedHeroesForName(message, playerName, nextCaller);
}

function requestRecentPlayedHeroesForName(message, playerName, nextCaller) {
    
    message.channel.startTyping();
    const messageArray = message.content.split(" ");

    //override default server
    const code = messageArray.length === 2?messageArray[1]:null;
    const serverCode = c.vgServerCode(code);

    var callback = function(list,matches) {

        var d = new Discord.RichEmbed()
            .setAuthor(playerName)
            .setColor("#0000FF");

        if (list.length > 0) {
            //console.log(JSON.stringify(list));
            
            var count = 0;
            
            var recentRate = "";
            var victoryRate = "";
            var totalVictory = 0;
        
            for (var obj of list) {
                if (count++ < 5) {
                    recentRate = recentRate + obj.name + ": " + (obj.value.played/matches*100).toFixed(0) + "% \n";
                    victoryRate = victoryRate + obj.name + ": " + (obj.value.victory/obj.value.played*100).toFixed(0) + "% \n";
                    totalVictory = totalVictory + obj.value.victory;
                }
            }
            
            //top pick as avatar
            const topPickHero = list[0].name;
            
            d = d.setThumbnail(`${c.imageURL()}/${topPickHero.toLowerCase()}.png`)
            .addField(`${i18n.get('RecentHeroes')}`, `${recentRate}`)
            .addField(`${i18n.get('WinningChance')} [${(totalVictory*100/50).toFixed(0)}%]`, `${victoryRate}`);
            
            message.channel.send(d);
            
            if (nextCaller !=null) {
                message.channel.stopTyping();
                nextCaller(message,playerName);
            }
        } else {
            message.channel.send(d.setDescription(`'${playerName}' ${i18n.get('NotFound')}`));
        }
        message.channel.stopTyping();
    };
    vg.setToken(VG_TOKEN);
    vg.getRecentPlayedHeroes(serverCode, playerName, callback);
}

function requestMatch(message) {
    
    const messageArray = message.content.split(" ");
    
    // restricted actions
    var playerName = messageArray[1];

    if (playerName.length == 0) {
        playerName = messageArray[countSpaces(message.content)];
    }
    
    requestMatchForPlayer(message, playerName);
}

function requestMatchForPlayer(message, playerName) {
    
    message.channel.startTyping();
    const messageArray = message.content.split(" ");
    
    //override default server
    const code = messageArray.length === 2?messageArray[1]:null;
    const serverCode = c.vgServerCode(code);

    var callback = function(text, data) {
        //console.log(JSON.stringify(data));
        if (data != null) {
            var header = `${data.match.gameMode} | ${data.duration} mins | ${data.createdAt} | ${i18n.get('Winner')}: ${i18n.get(data.won)} `; 
            var d = new Discord.RichEmbed()
                 .setAuthor(playerName)
                 .setColor("#000000")
                 .setDescription(header);
            
            const leftRoster = data.left; 
            const rightRoster = data.right;
            
            var heroName = null;

            d = d.addField('\u200B',`${i18n.get('Left')}:`);
            for (let player of leftRoster) {
            
                var guildTag = "";
            
                if (player.guildTag != "") {
                    guildTag = ` [${player.guildTag}]`
                }
                
                const kda = `${player.participant.kills}/${player.participant.deaths}/${player.participant.assists}`;
                
                d = d.addField(`${player.name}${guildTag} (${player.skillTier})`, `${player.participant.actor} | KDA ${kda}`);
            }
            
            d = d.addField('\u200B',`${i18n.get('Right')}:`);
            for (let player of rightRoster) {
            
                var guildTag = "";
                
                if (player.guildTag != "") {
                    guildTag = ` [${player.guildTag}]`
                }
                
                const kda = `${player.participant.kills}/${player.participant.deaths}/${player.participant.assists}`;
                
                d = d.addField(`${player.name}${guildTag} (${player.skillTier})`, `${player.participant.actor} | KDA ${kda}`);
            }
            
            d = d.setThumbnail(`${c.imageURL()}/${data.hero.toLowerCase()}.png`)
            
            //man of the match
            if (data.mom != null) {
                const mom = i18n.get(`Mom`).replace("$1",data.mom.name);
                d = d.setFooter(`${mom}`, `${c.imageURL()}/${data.mom.actor.toLowerCase()}.png`);
            }
            
            message.channel.send(d);
            message.channel.stopTyping();
            return;
        }

        // user has role
        var hasRole = false;

        for (var reqRole of c.restriction()) {
            if (message.member.roles.find("name", reqRole)) {
                hasRole = true;
                break;
            }
        }
        
        if (hasRole) {
        
            var d = new Discord.RichEmbed()
                .setAuthor(message.author.username)
                .setColor("#000000");

            if (text != null) {
                    message.channel.send(d.setDescription(`${text}`));
            } else {
                message.channel.send(d.setDescription(`${i18n.get('ErrorNoMatchFoundFor').replace('$1',playerName)}`));
            }
        }
        
        message.channel.stopTyping();
    };
    vg.setToken(VG_TOKEN);
    vg.getMatchStats(serverCode, playerName, callback);
}


//send message regarding counter pick
function sendCounter(message, embeded, hero) {
    
    let result = cp.getCounter(hero.toLowerCase());
    if (result != null) {
        embeded = embeded.setThumbnail(`${c.imageURL()}/${hero.toLowerCase()}.png`);
        message.channel.send(embeded.addField(`${hero} ${i18n.get('IsWeakAgainst')}`, result));
    } else {
        message.channel.send(embeded.setDescription(`'${hero}' ${i18n.get('NotFound')}`));
    }
}

//send message regarding support pick
function sendSupport(message, embeded, hero) {

    let result = cp.getSupport(hero.toLowerCase());
    if (result != null) {
        embeded = embeded.setThumbnail(`${c.imageURL()}/${hero.toLowerCase()}.png`);
        message.channel.send(embeded.addField(`${hero} ${i18n.get('IsStrongAgainst')}`, result));
    } else {
        message.channel.send(embeded.setDescription(`'${hero}' ${i18n.get('NotFound')}`))
    }
}


function countSpaces(string) {
    return (string.match(new RegExp(" ", "g")) || []).length;
}

function getGeneralInfo(heroName) {

    if (heroName != null) {
        let result = cp.getCounter(heroName.toLowerCase());
        let resultSupport = cp.getSupport(heroName.toLowerCase());

        if (result != null) {
            return result;
        } else {
            return null;
        }
    } else {
        return null;
    }
}

function getClassColor(classification) {
    if (classification.toLowerCase().includes("gold")) {
        return "#FFD700";
    } else if (classification.toLowerCase().includes("silve")) {
        return "#C0C0C0";
    } else if (classification.toLowerCase().includes("bronze")) {
        return "#cd7f32";
    }

    return "#FFFFFF";
}

/**
 * Calculate the difference between given date and today
 * @private
 * @param {Date} date target date for calculating difference
 * @returns map with days, hours, minutes
 * @type Map with Number
 */
function dateDiff(date) {

    var days, hours, minutes;

    const today = new Date();

    var differenceTravel = today.getTime() - date.getTime();
    var totalMinutes = Math.floor((differenceTravel) / ((1000) * 60));
    minutes = totalMinutes % 60;
    days = (totalMinutes - (totalMinutes % (24 * 60))) / (24 * 60);
    hours = (totalMinutes - (24 * days * 60) - minutes) / 60;

    return {
        days: days,
        hours: hours,
        minutes: minutes
    };
}

// function to get random message for tier
function randomTierMessage(value) {
    const random = Math.floor((Math.random() * 16) + 1);
    return i18n.get(`Random${random}`).replace("$1",value);
}

// login bot into discord
if (!(c.botToken() == null || c.botToken().length == 0)) {
    bot.login(c.botToken());
} else {
    console.log('Invalid Discord Token')
}