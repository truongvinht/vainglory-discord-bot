// vgMessage.js
// Vainglory related messages
// ================

//import
const Discord = require("discord.js");
const i18n = require('../general/langSupport');
const c = require("../general/constLoader");
const fm = require('../general/contentFormatter');
const access = require('../general/accessRightManager');
const colorMng = require('../controllers/messageColorManager');
const strH = require('../general/stringHelper');

//logger
const log = require('loglevel');

//elo calculator
const eloCalc = require('../controllers/eloCalculator');

const formatter = require('../general/contentFormatter');

// CONTROLLERS
var vg = require('../controllers/vainglory-req');

// MODEL
const vgBase = require('../models/vainglory-base');

// timeout for match related details in seconds
const MATCH_AUTO_DELETE_TIMER = 120*1000;

//singleton instance of vainglory token manager for handling api token 
var VaingloryToken = (function () {
    var instance;
    
    function initInstance() {
        var vgToken = "";
        
        //map for collecting matches (show details)
        var matchMap = {};
        
        return {
            //update token
            updateToken: function(updatedToken) {
                vgToken = updatedToken;
            },
            //read token
            token: function() {
                return vgToken;
            },
            setMessage: function(msgId,value) {
                matchMap[msgId] = value;
            },
            getMessage: function(msgId) {
                return matchMap[msgId];
            },
            removeMessage: function(msgId) {
                delete matchMap[msgId];
            }
        }
    }
    return {
        getInstance: function() {
            if (!instance) {
                instance = initInstance();
            }
            return instance;
        } 
    };
})();

// PLAYER INFO

/**
 * Getting vainglory player details
 * @param {Object} message msg object with calling argument
 * @param {Object} nextCaller msg object with calling argument
 */
let requestPlayerDetails = function(message, nextCaller){
    
    const messageArray = message.content.split(" ");
    
    var playerName = messageArray[1];

    if (playerName.length == 0) {
        playerName = messageArray[strH.numberOfSpaces(message.content)];
    }
    requestPlayerDetailsForName(message, playerName, nextCaller);
}

let requestPlayerDetailsForMe = function(message, playerName,nextCaller) {
    
    let didFailed = function(d,playerName) {
        let guildMember = access.getMember(message.channel,message.author.tag);
        requestPlayerDetailsForName(message, guildMember.displayName, nextCaller);
    }
    
    fetchPlayerDetails(message,playerName,nextCaller,didFailed);
}

let requestPlayerDetailsForName = function(message, playerName, nextCaller) {
    
    let didFailed = function(d,playerName) {
        message.channel.send(d.setDescription(`'${playerName}' ${i18n.get('NotFound')}`).setColor("#FFD700"));
    }
    
    fetchPlayerDetails(message,playerName,nextCaller,didFailed);
}

/**
 * Method to get player details
 * @private
 * @param {String} playerName name of player
 * @param {Object} player map with player details
 * @returns message object formatted for displaying 
 * @type Object
 */
function getPlayerDetails(playerName, player) {
    var d = new Discord.RichEmbed();
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
    
    // Rank
    const eloRank3v3Blitz = player.rankPoints.hasOwnProperty('blitz')?
        `Blitz: ${player.rankPoints.blitz}\n`: '';
    
    var eloRank3v3 = '';
    if (player.rankPoints.hasOwnProperty('ranked')) {
        if (player.rankPoints.ranked > 0) {
            eloRank3v3 = `Ranked: ${player.rankPoints.ranked} (${getTier(player.rankPoints.ranked)})\n`;
        }
    }
    var eloRank5v5 = '';

    if (player.rankPoints.hasOwnProperty('ranked_5v5')) {
        if (player.rankPoints.ranked_5v5 > 0) {
            const tier = `${getTier(player.rankPoints.ranked_5v5)}`;
            eloRank5v5 = `Ranked 5v5: ${player.rankPoints.ranked_5v5} (${tier})\n`;
        }
    }
    
    // Game mode
    const playedRank3v3 = player.gamesPlayed.hasOwnProperty('ranked')?
        `Ranked: ${player.gamesPlayed.ranked}\n`: '';

    const playedRank5v5 = player.gamesPlayed.hasOwnProperty('ranked_5v5')?
        `Ranked 5v5: ${player.gamesPlayed.ranked_5v5}\n`: '';

    const gamesPlayedContent =  `Casual 5v5: ${player.gamesPlayed.casual_5v5}\n` +
                          `Casual 3v3: ${player.gamesPlayed.casual}\n` +
                          playedRank3v3 + 
                          playedRank5v5 + 
                          `Blitz: ${player.gamesPlayed.blitz}\n` +
                          `Battle Royal: ${player.gamesPlayed.aral}`;

    const gameDate = formatter.dateToString(new Date(player.createdAt),`${i18n.get('DateFormattingCode')}`);
    


    return d.addField(`${i18n.get('RankPoints')}`, `${eloRank3v3Blitz}${eloRank3v3}${eloRank5v5}`)
        .addField(`${i18n.get('GamesPlayed')}`, `${gamesPlayedContent}`)
        .addField(`${i18n.get('Karma')}`, `${vgBase.getKarma(player.karmaLevel)}`)
        .addField(`${i18n.get('Victory')}`, `${player.wins}`)
        .addField(`${i18n.get('LastActive')}`, `${gameDate}\n${getTimeSince(player.createdAt)}`);
}

function updatePlayerDetails(message, playerName) {
    
    //override default server
    const serverCode = c.vgServerCode(null);

    const callback = function(playerName, player) {
        if (player != null) {
            const d = getPlayerDetails(playerName,player);
            message.edit(d.setAuthor(`${player.name}`));
        }
    };
    vg.setToken(VaingloryToken.getInstance().token());
    vg.getPlayerStats(serverCode, playerName, callback);
}

function fetchPlayerDetails(message, playerName, nextCaller, didFailedHandler) {

    message.channel.startTyping();
    
    //override default server
    const messageArray = message.content.split(" ");
    const code = messageArray.length === 3?messageArray[2]:null;
    const serverCode = c.vgServerCode(code);

    const callback = function(playerName, player) {

        var d = new Discord.RichEmbed();

        if (player != null) {
            d = getPlayerDetails(playerName,player);
            
            if (nextCaller !=null) {
                message.channel.send(d.setAuthor(`${player.name}`));
                message.channel.stopTyping();
                nextCaller(message,playerName);
            } else {
                message.channel.send(d.setAuthor(`${player.name}`)).then(async function (message) {

                    // action for showing player details
                    await message.react('🗒');

                    await message.react('🔄');
                    await message.react('🗑');
                });
                message.channel.stopTyping();
            }
        } else {
            message.channel.stopTyping();
            didFailedHandler(d,playerName);
        }
    };
    vg.setToken(VaingloryToken.getInstance().token());
    vg.getPlayerStats(serverCode, playerName, callback);
}

let requestPlayerDetailsInChannel = function(channel,playerName, code) {
    
    channel.startTyping();
    
    const serverCode = c.vgServerCode(code);

    var callback = function(playerName, player) {

        var d = new Discord.RichEmbed();

        if (player != null) {
            d = getPlayerDetails(playerName,player);
            channel.send(d.setAuthor(`${player.name}`));
        } else {
            channel.send(d.setDescription(`'${playerName}' ${i18n.get('NotFound')}`).setColor("#FFD700"));
        }
    
        channel.stopTyping();
    };
    vg.setToken(VaingloryToken.getInstance().token());
    vg.getPlayerStats(serverCode, playerName, callback);
}

// RECENT PLAYER INFORMATION

let requestRecentPlayedHeroes = function(message, nextCaller) {
    
    const messageArray = message.content.split(" ");
    
    var playerName = messageArray[1];

    if (playerName.length == 0) {
        playerName = messageArray[strH.numberOfSpaces(message.content)];
    }
    requestRecentPlayedHeroesForName(message, playerName, nextCaller);
}

let requestRecentPlayedHeroesForMe = function(message, playerName, nextCaller) {
    
    let didFailed = function(d,playerName) {
        let guildMember = access.getMember(message.channel,message.author.tag);
        requestRecentPlayedHeroesForName(message, guildMember.displayName,nextCaller);
    }
    
    fetchRecentPlaying(message,playerName, nextCaller, didFailed);
}

let requestRecentPlayedHeroesForName = function(message, playerName, nextCaller) {
    
    let didFailed = function(d,playerName) {
        message.channel.send(d.setDescription(`'${playerName}' ${i18n.get('NotFound')}`));
    }
    
    fetchRecentPlaying(message,playerName, nextCaller, didFailed);
}

function fetchRecentPlaying(message, playerName, nextCaller, didFailedHandler) {

    message.channel.startTyping();
    const messageArray = message.content.split(" ");

    //override default server
    const code = messageArray.length === 3?messageArray[2]:null;
    const serverCode = c.vgServerCode(code);

    var callback = function(list,playerList,matches, role, playedGameMode, playedTime) {

        var d = new Discord.RichEmbed()
            .setAuthor(playerName)
            .setColor(colorMng.getColor(8));

        if (list.length > 0) {
            var count = 0;
            
            var recentRate = "";
            var victoryRate = "";
            var totalVictory = 0;
        
            for (var obj of list) {
                if (count++ < 5) {
                    recentRate = recentRate + obj.name + ": " + (obj.value.played/matches*100).toFixed(0) + "% \n";
                    victoryRate = victoryRate + obj.name + ": " + (obj.value.victory/obj.value.played*100).toFixed(0) + "% \n";
                }
                totalVictory = totalVictory + obj.value.victory;
            }
            
            //Prepare Most played Role
            var mostPlayedRole = "-";
            
            var totalCountRoles = 0;
            
            for (let r of Object.keys(role)) {
                totalCountRoles = totalCountRoles + role[r];
            }
            
            for (let r of Object.keys(role)) {
                
                if (role[r] > totalCountRoles*0.3) {
                    if (mostPlayedRole=="-") {
                        mostPlayedRole = r;
                    } else {
                        mostPlayedRole = mostPlayedRole + ", " + r;
                    }
                }
            }
            
            //prepare player list
            count = 0;
            var recentNameRate = "";
            for (var pObj of playerList) {
                if (count++ < 5) {
                    const percentage = pObj.value.victory/pObj.value.played * 100;
                    recentNameRate = `${recentNameRate}${count}) **${pObj.name}**: ${pObj.value.victory} ${i18n.get('Victory')} | ${pObj.value.played} ${i18n.get('Matches')} [${percentage.toFixed(0)}%] \n`;
                }
            }
            
            //top pick as avatar
            const topPickHero = list[0].name;
            
            d = d.setThumbnail(`${c.imageURL()}/${topPickHero.toLowerCase()}.png`)
                .addField(`${i18n.get('RecentHeroes')}`, `${recentRate}`)
                .addField(`${i18n.get('WinningChance')} [${(totalVictory*100/matches).toFixed(0)}%]`, `${victoryRate}`);
            
            
            if (recentNameRate != "") {
                d = d.addField(`${i18n.get('PlayedWith')}`, `${recentNameRate}`);
            }
            
            var gModeList = [];
            
            // game mode
            for (var key of Object.keys(playedGameMode)) {
                gModeList.push({'name': key,'count':playedGameMode[key]});
            }
            
            gModeList.sort(function(a, b) {
                return b.count - a.count;
            });
            
            var gModeString = "";
            
            for (var row of gModeList) {
                if (gModeString.length == 0) {
                    gModeString =  `${row.name}: ${row.count}`;
                } else {
                    gModeString =  `${gModeString}, ${row.name}: ${row.count}`;
                }
            }
            
            d.addField(`${i18n.get('GamesPlayed')}`,gModeString);
            
            
            var playingTimeList = [];
            
            // playing time
            for (var key of Object.keys(playedTime)) {
                playingTimeList.push({'name': key,'count':playedTime[key]});
            }
            
            playingTimeList.sort(function(a, b) {
                return b.count - a.count;
            });

            var playingTimeString = "";

            count = 0;
            for (var row of playingTimeList) {
                if (count++ < 3) {

                    var today = new Date();
                    today.setHours(parseInt(row.name));
                    
                    const time = formatter.dateToHour(today,`${i18n.get('DateFormattingCode')}`);
                    if (count == 1) {
                        playingTimeString = time + `${i18n.get('oclock')}`;
                    } else {
                        playingTimeString = playingTimeString + ", " + time + `${i18n.get('oclock')}`;
                    }
                }
            }
            
            d = d.addField(`${i18n.get('MostPlayedTime')}`,playingTimeString);

            if (mostPlayedRole != "-") {
                d = d.addField(`${i18n.get('MostPlayedRoles')}`,mostPlayedRole);
            }
            
            message.channel.send(d).then(async function (message) {

                // action for showing player details
                await message.react('🗒');

                //TODO: needs to be optimized (dirty hack)
                if (playerList.length > 0) {
                    await message.react('1⃣');
                }
                
                if (playerList.length > 1) {
                    await message.react('2⃣');
                }
                
                if (playerList.length > 2) {
                    await message.react('3⃣');
                }
                
                if (playerList.length > 3) {
                    await message.react('4⃣');
                }
                
                if (playerList.length > 4) {
                    await message.react('5⃣');
                }
                await message.react('🗑');
            });
            
            if (nextCaller !=null) {
                message.channel.stopTyping();
                nextCaller(message,playerName);
            }
            message.channel.stopTyping();
        } else {
            message.channel.stopTyping();
            didFailedHandler(d,playerName);
        }
    };
    vg.setToken(VaingloryToken.getInstance().token());
    vg.getRecentPlayedHeroes(serverCode, playerName, callback);
}

let requestMatch = function(message) {
    
    const messageArray = message.content.split(" ");
    
    // restricted actions
    var playerName = messageArray[1];

    if (playerName.length == 0) {
        playerName = messageArray[strH.numberOfSpaces(message.content)];
    }
    
    requestMatchForPlayer(message,playerName);
}

let requestMatchForMe = function(message, playerName) {
    
    let didFailed = function(d,playerName) {
        let guildMember = access.getMember(message.channel,message.author.tag);
        requestMatchForPlayer(message, guildMember.displayName);
    }
    
    fetchMatch(message,playerName, false, didFailed);
}

let requestMatchForPlayer = function(message, playerName) {
    
    let didFailed = function(d,playerName) {
        message.channel.send(d.setDescription(`${i18n.get('ErrorNoMatchFoundFor').replace('$1',playerName)}`));
    }
    
    fetchMatch(message,playerName, false, didFailed);
}


function updateMatch(message, playerName) {
    
    let didFailed = function(d,playerName) {
        message.channel.send(d.setDescription(`${i18n.get('ErrorNoMatchFoundFor').replace('$1',playerName)}`));
    }
    
    fetchMatch(message,playerName, true, didFailed);
}


function fetchMatch(message, playerName, shouldUpdate, didFailedHandler) {
    
    message.channel.startTyping();
    const messageArray = message.content.split(" ");
    
    //override default server
    const code = messageArray.length === 3?messageArray[2]:null;
    const serverCode = c.vgServerCode(code);

    var callback = function(text, data) {
        if (data != null) {
            
            const gameDuration = data.duration;
            
            const gameDate = formatter.dateToString(new Date(data.createdAt),`${i18n.get('DateFormattingCode')}`);
            
            var header = `${data.match.gameMode} | ${gameDuration} mins | ${gameDate} | ${i18n.get('Winner')}: ${i18n.get(data.won)} `; 
            var d = new Discord.RichEmbed()
                 .setAuthor(playerName)
                 .setColor(colorMng.getColor(9))
                 .setDescription(header);
            
            const leftRoster = data.left; 
            const rightRoster = data.right;
            
            var heroName = null;
            
            const rosters = [{'side':'Left','dataRoster':leftRoster},
                            {'side':'Right','dataRoster':rightRoster}];
            
            let is5v5Match = leftRoster.length == 5;
            
            for (let r of rosters) {
                
                var totalKills = 0;
                for (let player of r.dataRoster) {
                    totalKills = totalKills + player.participant.kills;
                }
                
            
                d = d.addField('\u200B',`__**${i18n.get(r.side)} (${totalKills}):**__`);
                for (let player of r.dataRoster) {
                    var guildTag = "";
            
                    if (player.guildTag != "") {
                        guildTag = ` [${player.guildTag}]`
                    }
                
                    var afk = '';
                    if (player.participant.wentafk) {
                        afk = "AFK";
                    }
                    
                    var eloLevel = -1;
                    
                    if (is5v5Match) {
                        // 5v5 rank data
                        let score = eloCalc.getResult(player.ranked_5v5);
                        
                        if (score != null) {
                            eloLevel = score.elo;
                        }
                    } else {
                        // 3v3 rank data
                        let score = eloCalc.getResult(player.rankPoints);
                        
                        if (score != null) {
                            eloLevel = score.elo;
                        }
                    }
                    var tier = vgBase.getTier(eloLevel);
                    
                    if (tier == 'T0') {
                        tier = 'Unranked';
                    }
                    
                    //header
                    const header = `${player.name}${guildTag} (${tier}) ${afk}`;
                    
                    const heroSelection = player.participant.actor;
                    
                    const kills = player.participant.kills;
                    const deaths = player.participant.deaths;
                    const assists = player.participant.assists;
                    
                    const kda = `${kills}/${deaths}/${assists}`;
                    
                    const cs = player.participant.minionKills;
                    
                    const csPerMin = `${(cs / gameDuration).toFixed(1)} CS/m`;
                
                    d = d.addField(header, `${heroSelection} | KDA ${kda} | ${csPerMin} (${cs})`);
                }
            }
            
            d = d.setThumbnail(`${c.imageURL()}/${data.hero.toLowerCase()}.png`)
            
            //man of the match
            if (data.mom != null) {
                const mom = i18n.get(`Mom`).replace("$1",data.mom.name);
                d = d.setFooter(`${mom}`, `${c.imageURL()}/${data.mom.actor.toLowerCase()}.png`);
            }
            
            if (shouldUpdate) {
                message.edit(d).then(async function (message) {
                    VaingloryToken.getInstance().setMessage(`${message.id}`, data);
                });
            } else {
                message.channel.send(d).then(async function (message) {
                    await message.react('ℹ');
                    await message.react('📊');
                    await message.react('🔄');
                    await message.react('🗑');
                    VaingloryToken.getInstance().setMessage(`${message.id}`, data);
                });
            }
            
            message.channel.stopTyping();
            return;
        }
        
        message.channel.stopTyping();
        
        var d = new Discord.RichEmbed()
            .setAuthor(message.author.username)
            .setColor("#000000");

        if (text != null) {
            message.channel.send(d.setDescription(`${text}`));
        } else {
            didFailedHandler(d, playerName);
        }
        
    };
    vg.setToken(VaingloryToken.getInstance().token());
    vg.getMatchStats(serverCode, playerName, callback);
}

// Player draft/ hero selection and builds in target match
const matchDetails = (message) => {
    
    let matchData = VaingloryToken.getInstance().getMessage(message.id);
    
    if (matchData!=null && matchData.hasOwnProperty("asset")) {
        
        //try remove reactions
        message.clearReactions().catch(error => {});
        
        const channel = message.channel;
        
        channel.startTyping();
        var callback = function(data) {
            var d = new Discord.RichEmbed().setColor(colorMng.getColor(10)).setTitle(`${i18n.get('HeroSelection')}`);
            
            var ban = "";
            
            for (var banned of data.banned.left) {
                ban = ban + `${i18n.get('HeroBanned').replace('$1',`~~${banned}~~`)}\n`;
            }
            
            for (var selected of data.left) {
                ban = ban + `${selected.Hero} (${selected.Handle})\n`;
            }

            d = d.addField(`${i18n.get('Left')}`,`${ban}`);
            
            ban = "";
            for (var banned of data.banned.right) {
                ban = ban + `${i18n.get('HeroBanned').replace('$1',`~~${banned}~~`)}\n`;
            }
            for (var selected of data.right) {
                ban = ban + `${selected.Hero} (${selected.Handle})\n`;
            }
            
            d = d.addField(`${i18n.get('Right')}`,`${ban}`);
            d = d.addField('\u200B',`__**${i18n.get('Items')}:**__`);
            //items
            let infoData = data['data'];
            
            var builds = "";
            let leftTeam = infoData["left"];
            
            for (var p of leftTeam) {
                
                var items = "";
                
                var countItems = 0;
                if (p.participant.items.length > 0) {
                    for (var i of p.participant.items) {
                        
                        if (items==="") {
                            items = i;
                            countItems = 1;
                            continue;
                        }
                        items = items + ", " + i;
                        countItems = countItems+1;
                    }
                }
                
                //check player sold items
                let soldItems = getSoldItems(p.participant.actor,'Left',data.SellItem);
                if (soldItems == '-') {
                    items = `__${i18n.get('Bought')}:__ ${items}`;
                } else {
                    items = `__${i18n.get('SoldItems')}:__ ${soldItems}\n${i18n.get('Bought')}: ${items}`;
                }
            
                //console.log(`${p.name} / ${p.participant.actor} - ${JSON.stringify(items)}`);
                d = d.addField(`${p.participant.actor} (${p.name})`,`${items}`);
            }
            
            let rightTeam = infoData["right"];
            
            for (var p of rightTeam) {
                
                var items = "";
                if (p.participant.items.length > 0) {
                    for (var i of p.participant.items) {
                        
                        if (items==="") {
                            items = i;
                            continue;
                        }
                        
                        items = items + ", " + i;
                    }
                }
                
                //check player sold items
                let soldItems = getSoldItems(p.participant.actor,'Right',data.SellItem);
                if (soldItems == '-') {
                    items = `__${i18n.get('Bought')}:__ ${items}`;
                } else {
                    items = `__${i18n.get('SoldItems')}:__ ${soldItems}\n${i18n.get('Bought')}: ${items}`;
                }

                d = d.addField(`${p.participant.actor} (${p.name})`,`${items}`);
            }
            
            channel.send(d).then(async function (message) {
                await message.react('🗑');
                await setTimeout(function () {
                    message.delete();
                },MATCH_AUTO_DELETE_TIMER);
            });
            
            channel.stopTyping(true);
        };
        
        vg.getMatchDetails(matchData,callback)
        //TODO: needs to be reimplemented
        //VaingloryToken.getInstance().removeMessage(message.id);
    }
}

const matchDetailsPlayer  = (message) => {
    
    var playerName = null;
    
    for (var embed of message.embeds) {
        
        // reload player details
        if (colorMng.isMatch(embed.hexColor)) {
            playerName = embed.author.name;
            break;
        } else {
            log.info('Ignore call for match details');
            return;
        }
    }
    let matchData = VaingloryToken.getInstance().getMessage(message.id);
    
    const channel = message.channel;
    
    if (matchData!=null && matchData.hasOwnProperty("asset")) {
        channel.startTyping();
        
        let sendHeroStats = function (data, pname, hero) {

            // ELO
            var d = new Discord.RichEmbed().setColor(colorMng.getColor(12))
                .setTitle(`${i18n.get('AppliedAndReceivedDamageForHero').replace("$1", pname)}`)
                .setThumbnail(`${c.imageURL()}/${hero.replace("*", "").replace("*", "").toLowerCase()}.png`);
            // find own player
            let teamLeft = data.left;
            let teamRight = data.right;
            
            var ownData = null;
            
            for (let k of Object.keys(teamLeft)) {
                let hero = teamLeft[k];
                
                if (hero.name == pname) {
                    ownData = hero;
                }
            }
            
            if (ownData == null) {
                for (let k of Object.keys(teamRight)) {
                    let hero = teamRight[k];
                
                    if (hero.name == pname) {
                        ownData = hero;
                    }
                }
            }
            
            // kills / deaths
            var killDeathMap = {};
            
            for (let p of ownData.Kill) {
                
                if (killDeathMap.hasOwnProperty(p.Killed)) {
                    var hero = killDeathMap[p.Killed];
                    
                    if (hero.hasOwnProperty("Death")) {
                        hero["Death"] = hero["Death"]  + 1;
                    } else {
                        hero["Death"] = 1;
                    }
                } else {
                    killDeathMap[p.Killed] = {"Death": 1};
                }
            }
            
            for (let p of ownData.Death) {
                
                if (killDeathMap.hasOwnProperty(p.Actor)) {
                    var hero = killDeathMap[p.Actor];
                    
                    if (hero.hasOwnProperty("Kill")) {
                        hero["Kill"] = hero["Kill"]  + 1;
                    } else {
                        hero["Kill"] = 1;
                    }
                } else {
                    killDeathMap[p.Actor] = {"Kill": 1};
                }
            }
            
            
            if (Object.keys(killDeathMap).length > 0) {
                
                var kdString = "";
                for (let key of Object.keys(killDeathMap)) {
                    let h = killDeathMap[key];
                    
                    var kills = 0;
                    if (h.hasOwnProperty("Kill")) {
                        kills = h["Kill"];
                    }
                    
                    var deaths = 0;
                    if (h.hasOwnProperty("Death")) {
                        deaths = h["Death"];
                    }
                    
                    kdString = kdString + key.split("*").join("**") + " | KD " + kills + "/" + deaths + "\n";
                }
                
                d.addField('\u200B', kdString);
            }
            
            //console.log(JSON.stringify(ownData.Death));
            
            // damage dealt
            var dealtDmgMap = {};
            
            for (let dmg of ownData.DealDamage) {
                if (dealtDmgMap.hasOwnProperty(dmg.Target)) {
                    dealtDmgMap[dmg.Target] = dealtDmgMap[dmg.Target] + dmg.Dealt;
                } else {
                    dealtDmgMap[dmg.Target] = dmg.Dealt;
                }
            }
            
            var dealtDmgList = [];
            
            for (let k of Object.keys(dealtDmgMap)) {
                dealtDmgList.push({"name":`${k}`,"score":`${dealtDmgMap[k]}`});
            }
            
            dealtDmgList.sort(function(a, b) {
                return b.score - a.score;
            });
            
            // damage received
            var receivedDmgMap = {};
            
            for (let dmg of ownData.ReceiveDamage) {
                if (receivedDmgMap.hasOwnProperty(dmg.Actor)) {
                    receivedDmgMap[dmg.Actor] = receivedDmgMap[dmg.Actor] + dmg.Dealt;
                } else {
                    receivedDmgMap[dmg.Actor] = dmg.Dealt;
                }
            }
            
            var receiveDmgList = [];
            
            for (let k of Object.keys(receivedDmgMap)) {
                receiveDmgList.push({"name":`${k}`,"score":`${receivedDmgMap[k]}`});
            }
            
            receiveDmgList.sort(function(a, b) {
                return b.score - a.score;
            });
            
            // prepare text
            var damageDealtHeroes = "";

            for (let hero of dealtDmgList) {
                
                //filter non-heroes
                if (receivedDmgMap[hero.name] != undefined) {
                    damageDealtHeroes = `${damageDealtHeroes}${hero.name}: ${hero.score}\n`;
                } 
            }
            var damageReceivedHeroes = "";

            for (let hero of receiveDmgList) {
                
                //filter non-heroes
                if (dealtDmgMap[hero.name] != undefined) {
                    damageReceivedHeroes = `${damageReceivedHeroes}${hero.name}: ${hero.score}\n`;
                } 
            }
            
            if (damageDealtHeroes.length > 0) {
                d.addField(`${i18n.get('DamageDealt')}`, damageDealtHeroes.split("*").join("**"));
            }
            
            if (damageReceivedHeroes.length > 0) {
                d.addField(`${i18n.get('DamageReceived')}`, damageReceivedHeroes.split("*").join("**"));
            }
            
            channel.send(d).then(async function (message) {
                await message.react('🗑');
                await setTimeout(function () {
                    message.delete();
                },MATCH_AUTO_DELETE_TIMER);
            });
        };


        let callback = function(data) {
            
            // find own player
            let teamLeft = data.left;
            let teamRight = data.right;
            
            var ownData = null;
            
            for (let k of Object.keys(teamLeft)) {
                let hero = teamLeft[k];
                
                if (hero.name == playerName) {
                    ownData = hero;
                }
            }
            
            if (ownData == null) {
                for (let k of Object.keys(teamRight)) {
                    let hero = teamRight[k];
                    sendHeroStats(data,hero.name,k);
                }
            } else {
                for (let k of Object.keys(teamLeft)) {
                    let hero = teamLeft[k];
                    sendHeroStats(data,hero.name,k);
                }
            }

            channel.stopTyping();
        };
        
        vg.getMatchDetailsForPlayer(matchData, callback);
    }
    
}

const requestPlayerForEmoji = (message) => {

    var playerName = null;
    var playerNameForRecent = null;
    
    for (var embed of message.embeds) {
        
        // reload player details
        if (colorMng.isRecentStats(embed.hexColor)) {
            playerName = embed.author.name;
            break;
        } else if (colorMng.isPlayerDetails(embed.hexColor)) {
            playerNameForRecent = embed.author.name;
            break;
        } else {
            log.info('Ignore call');
            return;
        }
    }
    
    if (playerName != null) {
        requestPlayerDetailsForName(message,playerName,null);
    }

    if (playerNameForRecent != null) {
        requestRecentPlayedHeroesForName(message, playerNameForRecent,null);
    }
}

const requestEloForPlayer = (message, playerName, callback) => {

    vg.setToken(VaingloryToken.getInstance().token());
    
    const serverCode = c.vgServerCode(null);
    
    vg.getPlayerStats(serverCode, playerName, callback);
}

const fullDetails = (message, playerName) => {

    const callbackRecentHeroes = function(message, playerName) {
        const callbackMatch = function(message, playerName) {
            requestMatchForPlayer(message,playerName);
        }
        requestRecentPlayedHeroesForName(message,playerName, callbackMatch);
    }
    
    requestPlayerDetailsForName(message,playerName, callbackRecentHeroes);
}

const reloadContent = (message) => {
    
    for (var embed of message.embeds) {
        
        // reload player details
        if (colorMng.isPlayerDetails(embed.hexColor)) {
            const author = embed.author.name;
            updatePlayerDetails(message, author);
            break;
        }
        
        // reload match details
        if (colorMng.isMatch(embed.hexColor)) {
            const author = embed.author.name;
            updateMatch(message, author);
            break;
        }
    }
}

const loadMateDetails = (message, position) => {
    
    for (var embed of message.embeds) {
        
        // recent played team mate
        if (colorMng.isRecentStats(embed.hexColor)) {
            
            // 2nd field contains mate names
            const field = embed.fields[2];
            
            const rawMateData = field.value.split('\n');
            
            //check for valid index
            if (rawMateData.length > position - 1) {
                const playerName = strH.collectWrappedString(rawMateData[position-1],'**');
                requestPlayerDetailsForName(message, playerName,null);
            }
            break;
        }
    }
}


function getSoldItems(actor, team, soldItemList) {
    var items = '';
    
    for (var i of soldItemList) {
        if (actor === i.payload.Actor.replace('\*', '').replace('\*', '') && team === i.payload.Team) {
            if (items==="") {
                items = i.payload.Item;
                continue;
            }
            
            items = items + ", " + i.payload.Item;
        }
    }
    if (items == '') {
        return '-';
    }
    
    return items;
}

let afkDetails = function(list, channel) {
    
    var callback = function(content) {
        var d = new Discord.RichEmbed().setColor("#FFFFFF");
        
        
        if (content != null) {
            
            d = d.setTitle(`${i18n.get('LastActive')}`);
            
            var contentMessage = "";
            
            var count = 0;
            
            for (var p of content) {

                var diff = fm.timeToNow(new Date(p.createdAt));
                
                contentMessage = `${contentMessage}${p.name} [${p.skillTier}] - ${getTimeSince(p.createdAt)}\n`;
                
                count = count + 1;
                
                if (count >= 20) {
                    count = 0;
                    d = d.addField('\u200B',contentMessage);
                    contentMessage = "";
                }
            }
            
            if (contentMessage.length > 0) {
                d = d.addField('\u200B',contentMessage);
            }
            channel.send(d);
        } else {
            channel.send(d.setDescription(`'${list}' ${i18n.get('NotFound')}`).setColor("#FFD700"));
        }
        return;
    }

    vg.setToken(VaingloryToken.getInstance().token());
    
    const serverCode = c.vgServerCode(null);
    
    //needs to figure out for more than 6 ids
    vg.getPlayersInfo(serverCode, list, callback);
}

function getTimeSince(time) {
    var diff = fm.timeToNow(new Date(time));
    return `${diff['days']} d ${diff['hours']} h ${diff['minutes']} m `;
}

function getClassColor(classification) {
    if (classification.toLowerCase().includes(i18n.get('Gold').toLowerCase())) {
        return colorMng.getColor(7);
    } else if (classification.toLowerCase().includes(i18n.get('Silver').toLowerCase())) {
        return colorMng.getColor(6);
    } else if (classification.toLowerCase().includes(i18n.get('Bronze').toLowerCase())) {
        return colorMng.getColor(5);
    }

    return "#FFFFFF";
}

/**
 * Function to set/update vainglory API token
 * @param {String} token vainglory API token for requests
 */
const setToken = (token) => {
    VaingloryToken.getInstance().updateToken(token);
}

/**
 * Function to get current Vainglory API Token
 * @returns current Vainglory API token
 * @type String
 */
const getToken = () => {
    VaingloryToken.getInstance().token();
}

/**
 * Function to get current tier for given elo scores
 * @returns Tier description
 * @type String
 */
const getTier = (points) => {

    var eloLevel = -1;
                    
    let score = eloCalc.getResult(points);
        
    if (score != null) {
        eloLevel = score.elo;
    }
    var tier = vgBase.getTier(eloLevel);
    
    if (tier == 'T0') {
        tier = 'Unranked';
    }
    return tier;
}

// export
module.exports = {
    setToken: setToken,
    getToken: getToken,
    requestPlayerDetails: requestPlayerDetails,
    requestPlayerDetailsForName: requestPlayerDetailsForName,
    requestPlayerDetailsForMe:requestPlayerDetailsForMe,
    requestPlayerDetailsInChannel:requestPlayerDetailsInChannel,
    requestRecentPlayedHeroes: requestRecentPlayedHeroes,
    requestRecentPlayedHeroesForMe:requestRecentPlayedHeroesForMe,
    requestRecentPlayedHeroesForName:requestRecentPlayedHeroesForName,
    requestMatch: requestMatch,
    requestMatchForMe: requestMatchForMe,
    requestMatchForPlayer: requestMatchForPlayer,
    getMatchDetails:matchDetails,
    getMatchDetailsForPlayer: matchDetailsPlayer,
    getFullPlayerDetails: fullDetails,
    requestEloForPlayer: requestEloForPlayer,
    requestPlayerForEmoji: requestPlayerForEmoji,
    reloadContent: reloadContent,
    loadMates: loadMateDetails,
    afkInfo: afkDetails
};