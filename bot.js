// bot.js
// main class to run discord bot
// ================

//import
const Discord = require("discord.js");
const c = require("./constLoader");
const i18n = require('./langSupport');
const vgBase = require('./vainglory-base');
var vg = require('./vainglory-req');

//counter picker
const cp = require('./vgCounterPicker');

//elo calculator
const eloCalc = require('./eloCalculator');

// CONSTANTS

// prefix for commands
const PREFIX = c.prefix();
const VG_TOKEN = c.vgToken();

const bot = new Discord.Client({
    disableEveryone: true
});

// prepare invite code
bot.on("ready", async() => {
    console.log(`${i18n.get('BotReady')} ${bot.user.username}`);
    try {
        let link = await bot.generateInvite(["ADMINISTRATOR"]);
        console.log(link);
        
        //load URL
        eloCalc.initURL(`${c.eloListURL()}`);
    } catch (e) {
        console.log(e.stack);
    }
});

// reaction for message
bot.on("message", async message => {
    
    //ignore own messages
    if (message.author.bot) return;

    //ignore commands without prefix
    if (!message.content.startsWith(PREFIX)) return;

    let messageArray = message.content.split(" ");
    let command = messageArray[0];

    //prevent direct message
    if (message.channel.type === "dm"){ 
        
        //var bh = require('./botHelper');
        //bh.getData(bot);
        // // send message to a target channel
        // if (command.toLowerCase() === `${PREFIX}msg`) {
        //     if(messageArray.length <= 2){
        //         return;
        //     }
        //
        //     for (var c of bot.channels.array()) {
        //
        //         //text channel with name
        //         if (c.type == "text") {
        //             if (messageArray[1] === c.name) {
        //                 c.send(message.content.substring(
        //                     messageArray[0].length + messageArray[1].length + 2, message.content.length));
        //                 break;
        //             }
        //         }
        //     }
        // }
        
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
            .addField(`${PREFIX}counter HERO`, `${i18n.get('DisplayWeaknessHero')}`)
            .addField(`${PREFIX}c HERO-CODE`, `${i18n.get('DisplayWeaknessHeroCode')}`)
            .addField(`${PREFIX}support HERO`, `${i18n.get('DisplayStrengthHero')}`)
            .addField(`${PREFIX}s HERO-CODE`, `${i18n.get('DisplayStrengthHeroCode')}`)
            .addField(`${PREFIX}HERO-CODE`, `${i18n.get('DisplayInfoHeroCode')}`)
            .addField(`${PREFIX}hero`, `${i18n.get('DisplayListHero')}`)
            .addField(`${PREFIX}player ${i18n.get('Player')} [server]`, `${i18n.get('HelpPlayerDetails')}`)
            .addField(`${PREFIX}recent ${i18n.get('Player')} [server]`, `${i18n.get('RecentHeroes')}`)
            .addField(`${PREFIX}info ${i18n.get('Player')} / ${PREFIX}i ${i18n.get('Player')}`, `${i18n.get('HelpPlayerDetailsFull')}`)
            .addField(`${PREFIX}elo ELO`, `${i18n.get('EloDetails')}`);

        if (hasRole) {
            embed.addField(`${PREFIX}match ${i18n.get('Player')} [server]`, `${i18n.get('LastMatchDetails')}`);
            embed.addField(`${PREFIX}clear`, `${i18n.get('ClearCmd')}`);
        }
        message.channel.send(embed);
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
                    .setDescription(`'${heroName}': ${i18n.get('InvalidHeroCode')}`));
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

            if (hasRole) {
                // restricted actions
                var playerName = messageArray[1];

                if (playerName.length == 0) {
                    playerName = messageArray[countSpaces(message.content)];
                }

                //override default server
                const code = messageArray.length === 3?messageArray[2]:null;
                const serverCode = c.vgServerCode(code);

                var callback = function(text, matchID) {

                    var d = new Discord.RichEmbed()
                        .setAuthor(message.author.username)
                        .setColor("#000000");

                    if (text != null) {
                        message.channel.send(d.setDescription(`${text}`));
                    } else {
                        message.channel.send(d.setDescription(`'${matchID}' ${i18n.get('NotFound')}`));
                    }
                };
                vg.setToken(VG_TOKEN);
                vg.getMatchStats(serverCode, playerName, callback);
            } 
        }

        // show recent played heroes
        if (command.toLowerCase() === `${PREFIX}recent`) {
            requestRecentPlayedHeroes(message, null);
            return;
        }
        
        //elo overview
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
        }
    }
});


function requestPlayerDetails(message, nextCaller){
    
    const messageArray = message.content.split(" ");
    
    var playerName = messageArray[1];

    if (playerName.length == 0) {
        playerName = messageArray[countSpaces(message.content)];
    }

    //override default server
    const code = messageArray.length === 3?messageArray[2]:null;
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
                nextCaller(message,playerName);
            }
        } else {
            message.channel.send(d.setDescription(`'${playerName}' ${i18n.get('NotFound')}`).setColor("#FFD700"));
        }
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

    //override default server
    const code = messageArray.length === 3?messageArray[2]:null;
    const serverCode = c.vgServerCode(code);

    var callback = function(list,matches) {

        var d = new Discord.RichEmbed()
            .setAuthor(message.author.username)
            .setColor("#0000FF");

        if (list.length > 0) {
            // count output
            var count = 0;
            var text = "";
        
            for (var obj of list) {
                if (count++ < 5) {
                    text = text + obj.name + ": " + (obj.value/matches*100).toFixed(0) + "% \n";
                }
            }
            
            //top pick as avatar
            const topPickHero = list[0].name;
            
            d = d.setThumbnail(`${c.imageURL()}/${topPickHero.toLowerCase()}.png`)
            .addField(`${playerName}: ${i18n.get('RecentHeroes')}`, `${text}`);
            
            message.channel.send(d);
            
            if (nextCaller !=null) {
                nextCaller(message,playerName);
            }
        } else {
            message.channel.send(d.setDescription(`'${playerName}' ${i18n.get('NotFound')}`));
        }
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

    //override default server
    const code = messageArray.length === 3?messageArray[2]:null;
    const serverCode = c.vgServerCode(code);

    var callback = function(text, matchID) {

        var d = new Discord.RichEmbed()
            .setAuthor(message.author.username)
            .setColor("#000000");

        if (text != null) {
            message.channel.send(d.setDescription(`${text}`));
        } else {
            message.channel.send(d.setDescription(`'${matchID}' ${i18n.get('NotFound')}`));
        }
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
bot.login(c.botToken());