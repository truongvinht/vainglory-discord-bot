// bot.js
// main class to run discord bot
// ================

const botSettings = require("./botsettings.json");
const Discord = require("discord.js");
const i18n = require('./langSupport');
const vgBase = require('./vainglory-base');
var vg = require('./vainglory-req');

//counter picker
const cp = require('./vgCounterPicker');

const bot = new Discord.Client({
    disableEveryone: true
});

//Image source
var imageURL = botSettings.imageURL;
if (imageURL == "") {
    // Heroku ENV token
    imageURL = process.env.IMAGE_URL;
}

// github image url for Tier
const tierImageURL = process.env.TIER_IMAGE_URL;

// prepare invite code
bot.on("ready", async() => {
    console.log(`${i18n.get('BotReady')} ${bot.user.username}`);
    try {
        let link = await bot.generateInvite(["ADMINISTRATOR"]);
        console.log(link);
    } catch (e) {
        console.log(e.stack);
    }
});

// reaction for message
bot.on("message", async message => {

    if (message.author.bot) return;

    if (!message.content.startsWith(botSettings.prefix)) return;

    //check for direct message
    if (message.channel.type === "dm") return;

    let messageArray = message.content.split(" ");
    let command = messageArray[0];

    var hasRole = false;

    for (var reqRole of botSettings.restricted) {
        if (message.member.roles.find("name", reqRole)) {
            hasRole = true;
            break;
        }
    }

    if (command === `${botSettings.prefix}help`) {
        let embed = new Discord.RichEmbed()
            .setAuthor(message.author.username)
            .setDescription(`${i18n.get('FollowingCommands')}`)
            .addField(`${botSettings.prefix}counter HERO`, `${i18n.get('DisplayWeaknessHero')}`)
            .addField(`${botSettings.prefix}c HERO-CODE`, `${i18n.get('DisplayWeaknessHeroCode')}`)
            .addField(`${botSettings.prefix}support HERO`, `${i18n.get('DisplayStrengthHero')}`)
            .addField(`${botSettings.prefix}s HERO-CODE`, `${i18n.get('DisplayStrengthHeroCode')}`)
            .addField(`${botSettings.prefix}HERO-CODE`, `${i18n.get('DisplayInfoHeroCode')}`)
            .addField(`${botSettings.prefix}hero`, `${i18n.get('DisplayListHero')}`)
            .addField(`${botSettings.prefix}player ${i18n.get('Player')} [server]`, `${i18n.get('HelpPlayerDetails')}`)
            .addField(`${botSettings.prefix}recent ${i18n.get('Player')} [server]`, `${i18n.get('RecentHeroes')}`);

        if (hasRole) {
            embed.addField(`${botSettings.prefix}match ${i18n.get('Player')} [server]`, `${i18n.get('LastMatchDetails')}`);
            embed.addField(`${botSettings.prefix}clear`, `${i18n.get('ClearCmd')}`);
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
                    d = d.setThumbnail(`${imageURL}/${heroName.toLowerCase()}.png`);
                    d = d.addField(`${heroName} ${i18n.get('IsWeakAgainst')}`, result)
                        .addField(`${heroName} ${i18n.get('IsStrongAgainst')}`, resultSupport);
                    message.channel.send(d);
                } else {
                    message.channel.send(d.setDescription(`'${heroName}': ${i18n.get('EnteredHeroDoesntExist')}`));
                }
            } else {
                message.channel.send(d.setDescription(`'${hName}': ${i18n.get('EnteredHeroDoesntExist')}`));
            }
        }
    }

    if (messageArray.length >= 2) {

        let hero = messageArray[1].toLowerCase();

        // counter pick
        if (command === `${botSettings.prefix}counter`) {

            var d = new Discord.RichEmbed()
                .setAuthor(message.author.username)
                .setColor("#ff0000");

            let result = cp.getCounter(hero);

            if (result != null) {
                d = d.setThumbnail(`${imageURL}/${hero.toLowerCase()}.png`);
                message.channel.send(d.addField(`${hero} ${i18n.get('IsWeakAgainst')}`, result));
            } else {
                message.channel.send(d.setDescription(`'${heroName}' ${i18n.get('NotFound')}`));
            }
        }

        // quick counter pick
        if (command.toLowerCase() === `${botSettings.prefix}c`) {

            var d = new Discord.RichEmbed()
                .setAuthor(message.author.username)
                .setColor("#ff0000");

            //hero quick name
            let hName = messageArray[1].toLowerCase();

            let heroName = cp.getHeroName(hName);

            if (heroName != null) {

                let result = cp.getCounter(heroName.toLowerCase());

                if (result != null) {
                    d = d.setThumbnail(`${imageURL}/${heroName.toLowerCase()}.png`);
                    message.channel.send(d.addField(`${heroName} ${i18n.get('IsWeakAgainst')}`, result));
                } else {
                    message.channel.send(d.setDescription(`'${heroName}' ${i18n.get('NotFound')}`));
                }
            } else {
                message.channel.send(new Discord.RichEmbed()
                    .setAuthor(message.author.username)
                    .setDescription(`'${heroName}': ${i18n.get('InvalidHeroCode')}`));
            }
        }

        // support pick
        if (command === `${botSettings.prefix}support`) {

            var d = new Discord.RichEmbed()
                .setAuthor(message.author.username)
                .setColor("#008000");

            let result = cp.getSupport(hero);

            if (result != null) {
                d = d.setThumbnail(`${imageURL}/${hero.toLowerCase()}.png`);
                message.channel.send(d.addField(`${hero} ${i18n.get('IsStrongAgainst')}`, result));
            } else {
                message.channel.send(d.setDescription(`'${heroName}' ${i18n.get('NotFound')}`))
            }
        }

        // quick support pick
        if (command.toLowerCase() === `${botSettings.prefix}s`) {

            var d = new Discord.RichEmbed()
                .setAuthor(message.author.username)
                .setColor("#008000");

            //hero quick name
            let hName = messageArray[1].toLowerCase();
            let heroName = cp.getHeroName(hName);

            if (heroName != null) {
                let result = cp.getSupport(heroName.toLowerCase());

                if (result != null) {
                    d = d.setThumbnail(`${imageURL}/${heroName.toLowerCase()}.png`);
                    message.channel.send(d.addField(`${heroName} ${i18n.get('IsStrongAgainst')}`, result));
                } else {
                    message.channel.send(d.setDescription(`'${heroName}' ${i18n.get('NotFound')}`));
                }
            } else {
                message.channel.send(new Discord.RichEmbed()
                    .setAuthor(message.author.username)
                    .setDescription(`'${heroName}': ${i18n.get('InvalidHeroCode')}`));
            }
        }
        
        //only allow users with roles
        if (command.toLowerCase() === `${botSettings.prefix}match`) {

            if (hasRole) {
                // restricted actions
                var playerName = messageArray[1];

                if (playerName.length == 0) {
                    playerName = messageArray[countSpaces(message.content)];
                }

                var serverCode = botSettings.vaingloryAPIServer;

                //override default server
                if (messageArray.length === 3 && messageArray[2].length > 1 && messageArray[2].length < 4) {
                    serverCode = messageArray[2];
                }

                // prepare VG API token
                var vgToken = "";
                if (botSettings.vgAPIToken != "") {
                    // use local TOKEN from settings
                    vgToken = botSettings.vgAPIToken;
                } else {
                    // Heroku ENV token
                    vgToken = process.env.vgAPIToken;
                }

                var callback = function(text, matchID, matchDate, dbKey) {

                    var d = new Discord.RichEmbed()
                        .setAuthor(message.author.username)
                        .setColor("#000000");

                    if (text != null) {
                        message.channel.send(d.setDescription(`${text}`));
                    } else {
                        message.channel.send(d.setDescription(`'${matchID}' ${i18n.get('NotFound')}`));
                    }
                };
                vg.setToken(vgToken);
                vg.getMatchStats(serverCode, playerName, callback);
            } 
        }

        // show recent played heroes
        if (command.toLowerCase() === `${botSettings.prefix}recent`) {
            var playerName = messageArray[1];

            if (playerName.length == 0) {
                playerName = messageArray[countSpaces(message.content)];
            }

            var serverCode = botSettings.vaingloryAPIServer;

            //override default server
            if (messageArray.length === 3 && messageArray[2].length > 1 && messageArray[2].length < 4) {
                serverCode = messageArray[2];
            }

            // prepare VG API token
            var vgToken = "";
            if (botSettings.vgAPIToken != "") {
                // use local TOKEN from settings
                vgToken = botSettings.vgAPIToken;
            } else {
                // Heroku ENV token
                vgToken = process.env.vgAPIToken;
            }

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
                    
                    d = d.setThumbnail(`${imageURL}/${topPickHero.toLowerCase()}.png`)
                    .addField(`${playerName}: ${i18n.get('RecentHeroes')}`, `${text}`);
                    
                    message.channel.send(d);
                } else {
                    message.channel.send(d.setDescription(`'${playerName}' ${i18n.get('NotFound')}`));
                }
            };
            vg.setToken(vgToken);
            vg.getRecentPlayedHeroes(serverCode, playerName, callback);
        }

        //show player stats
        if (command.toLowerCase() === `${botSettings.prefix}player`) {
            var playerName = messageArray[1];

            if (playerName.length == 0) {
                playerName = messageArray[countSpaces(message.content)];
            }

            var serverCode = botSettings.vaingloryAPIServer;

            //override default server
            if (messageArray.length === 3 && messageArray[2].length > 1 && messageArray[2].length < 4) {
                serverCode = messageArray[2];
            }

            // prepare VG API token
            var vgToken = "";
            if (botSettings.vgAPIToken != "") {
                // use local TOKEN from settings
                vgToken = botSettings.vgAPIToken;
            } else {
                // Heroku ENV token
                vgToken = process.env.vgAPIToken;
            }

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
                    if (tierImageURL!=null && tierImageURL!="") {
                         d = d.setThumbnail(`${tierImageURL}/${player.skillTierImg}.png?raw=true`);
                    }
                    
                    d = d.addField(`${i18n.get('RankPoints')}`, `Blitz: ${player.rankPoints.blitz}\nRanked: ${player.rankPoints.ranked}`)
                        .addField(`${i18n.get('GamesPlayed')}`, `Casual 5v5: ${player.gamesPlayed.casual_5v5}\nCasual 3v3: ${player.gamesPlayed.casual}\nRanked: ${player.gamesPlayed.ranked}\nBlitz: ${player.gamesPlayed.blitz}\nBattle Royal: ${player.gamesPlayed.aral}`)
                        .addField(`${i18n.get('Karma')}`, `${vgBase.getKarma(player.karmaLevel)}`)
                        .addField(`${i18n.get('Victory')}`, `${player.wins}`)
                        .addField(`${i18n.get('LastActive')}`, `${player.createdAt}`)
                    message.channel.send(d.setAuthor(`${player.name}`));
                } else {
                    message.channel.send(d.setDescription(`'${playerName}' ${i18n.get('NotFound')}`).setColor("#FFD700"));
                }
            };
            vg.setToken(vgToken);
            vg.getPlayerStats(serverCode, playerName, callback);
        }

        //hidden feature to fetch player IDs
        if (command === `${botSettings.prefix}afk`) {
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

                // prepare VG API token
                var vgToken = "";
                if (botSettings.vgAPIToken != "") {
                    // use local TOKEN from settings
                    vgToken = botSettings.vgAPIToken;
                } else {
                    // Heroku ENV token
                    vgToken = process.env.vgAPIToken;
                }

                vg.setToken(vgToken);

                //needs to figure out for more than 6 ids
                vg.getPlayersInfo(botSettings.vaingloryAPIServer, list, callback);
            } else {
                message.channel.send(`'${message.author.username}': ${i18n.get('NoPermissionCommand')}`);
            }
        }

    } else {
        // show heroes list
        if (command === `${botSettings.prefix}hero`) {

            var d = new Discord.RichEmbed()
                .setAuthor(message.author.username);

            let keyValueMap = cp.getHeroes();
            message.channel.send(d.addField(keyValueMap.title, keyValueMap.content));
        } else if (command === `${botSettings.prefix}clear` && hasRole) {
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

if (botSettings.token != "") {
    // use local TOKEN from settings
    bot.login(botSettings.token);
} else {
    // Heroku ENV token
    bot.login(process.env.BOT_TOKEN);
}
