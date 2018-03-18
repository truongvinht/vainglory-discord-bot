// vgMessage.js
// Vainglory related messages
// ================

//import
const Discord = require("discord.js");
const i18n = require('../general/langSupport');
const c = require("../general/constLoader");
const fm = require('../general/contentFormatter');

// CONTROLLERS
var vg = require('../controllers/vainglory-req');

// MODEL
const vgBase = require('../models/vainglory-base');

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

let requestPlayerDetailsForName = function(message, playerName, nextCaller) {
    
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
    vg.setToken(VaingloryToken.getInstance().token());
    vg.getPlayerStats(serverCode, playerName, callback);
}

let requestPlayerDetailsInChannel = function(channel,playerName, code) {
    channel.startTyping();
    
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
            channel.send(d.setAuthor(`${player.name}`));
            
        } else {
            channel.send(d.setDescription(`'${playerName}' ${i18n.get('NotFound')}`).setColor("#FFD700"));
        }
    
        channel.stopTyping();
    };
    vg.setToken(VaingloryToken.getInstance().token());
    vg.getPlayerStats(serverCode, playerName, callback);
}


let requestRecentPlayedHeroes = function(message, nextCaller) {
    
    const messageArray = message.content.split(" ");
    
    var playerName = messageArray[1];

    if (playerName.length == 0) {
        playerName = messageArray[strH.numberOfSpaces(message.content)];
    }
    requestRecentPlayedHeroesForName(message, playerName, nextCaller);
}

let requestRecentPlayedHeroesForName = function(message, playerName, nextCaller) {
    
    message.channel.startTyping();
    const messageArray = message.content.split(" ");

    //override default server
    const code = messageArray.length === 2?messageArray[1]:null;
    const serverCode = c.vgServerCode(code);

    var callback = function(list,playerList,matches) {

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
            
            //prepare player list
            count = 0;
            var recentNameRate = "";
            for (var pObj of playerList) {
                if (count++ < 5) {
                    recentNameRate = `${recentNameRate}${pObj.name}: ${pObj.value.victory} ${i18n.get('Victory')} | ${pObj.value.played} ${i18n.get('Matches')} \n`
                    
                }
            }
            
            //top pick as avatar
            const topPickHero = list[0].name;
            
            d = d.setThumbnail(`${c.imageURL()}/${topPickHero.toLowerCase()}.png`)
            .addField(`${i18n.get('RecentHeroes')}`, `${recentRate}`)
            .addField(`${i18n.get('WinningChance')} [${(totalVictory*100/50).toFixed(0)}%]`, `${victoryRate}`);
            
            if (recentNameRate != "") {
                d = d.addField(`${i18n.get('PlayedWith')}`, `${recentNameRate}`);
            }
            
            
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
    
    requestMatchForPlayer(message, playerName);
}

let requestMatchForPlayer = function(message, playerName) {
    
    message.channel.startTyping();
    const messageArray = message.content.split(" ");
    
    //override default server
    const code = messageArray.length === 2?messageArray[1]:null;
    const serverCode = c.vgServerCode(code);

    var callback = function(text, data) {
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
                
                var afk = '';
                if (player.participant.wentafk) {
                    afk = "AFK";
                }
                
                const kda = `${player.participant.kills}/${player.participant.deaths}/${player.participant.assists}`;
                
                d = d.addField(`${player.name}${guildTag} (${player.skillTier}) ${afk}`, `${player.participant.actor} | KDA ${kda} | CS ${player.participant.minionKills}`);
            }
            
            d = d.addField('\u200B',`${i18n.get('Right')}:`);
            for (let player of rightRoster) {
            
                var guildTag = "";
                
                if (player.guildTag != "") {
                    guildTag = ` [${player.guildTag}]`
                }
                
                var afk = '';
                if (player.participant.wentafk) {
                    afk = "AFK";
                }
                
                
                const kda = `${player.participant.kills}/${player.participant.deaths}/${player.participant.assists}`;
                
                d = d.addField(`${player.name}${guildTag} (${player.skillTier}) ${afk}`, `${player.participant.actor} | KDA ${kda} | CS ${player.participant.minionKills}`);
            }
            
            d = d.setThumbnail(`${c.imageURL()}/${data.hero.toLowerCase()}.png`)
            
            //man of the match
            if (data.mom != null) {
                const mom = i18n.get(`Mom`).replace("$1",data.mom.name);
                d = d.setFooter(`${mom}`, `${c.imageURL()}/${data.mom.actor.toLowerCase()}.png`);
            }
            
            message.channel.send(d).then(message => {
                message.react('ℹ');
                VaingloryToken.getInstance().setMessage(`${message.id}`, data);
            }
            
            );
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
    vg.setToken(VaingloryToken.getInstance().token());
    vg.getMatchStats(serverCode, playerName, callback);
}

const matchDetails = (message) => {
    
    let matchData = VaingloryToken.getInstance().getMessage(message.id);
    
    if (matchData.asset !=null) {
        
        //remove reaction
        message.clearReactions();
        
        const channel = message.channel;
        
        channel.startTyping();
        var callback = function(data) {
            var d = new Discord.RichEmbed().setColor("#000000").setTitle(`${i18n.get('HeroSelection')}`);
            
            var ban = "";
            
            for (var banned of data.banned.left) {
                ban = ban + `${i18n.get('HeroBanned').replace('$1',banned)}\n`;
            }
            
            for (var selected of data.left) {
                ban = ban + `${selected.Hero} [${selected.Handle}]\n`;
            }

            console.log('Ban L: '+JSON.stringify(ban));
            d = d.addField(`${i18n.get('Left')}`,`${ban}`);
            
            ban = "";
            for (var banned of data.banned.right) {
                ban = ban + `${i18n.get('HeroBanned').replace('$1',banned)}\n`;
            }
            for (var selected of data.right) {
                ban = ban + `${selected.Hero} [${selected.Handle}]\n`;
            }
            
            console.log('Ban R: '+JSON.stringify(ban));
            d = d.addField(`${i18n.get('Right')}`,`${ban}`);
            
            d = d.addField('\u200B',`${i18n.get('Items')}:`);
            //items
            let infoData = data['data'];
            
            var builds = "";
            let leftTeam = infoData["left"];
            
            for (var p of leftTeam) {
                
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
                if (items == '') {
                    items = `${i18n.get('SoldItems')}: ${getSoldItems(p.participant.actor,'Left',data.SellItem)}`;
                }
            
                //console.log(`${p.name} / ${p.participant.actor} - ${JSON.stringify(items)}`);
                d = d.addField(`${p.name} / ${p.participant.actor}`,`${items}`);
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
                if (items == '') {
                    items = `${i18n.get('SoldItems')}: ${getSoldItems(p.participant.actor,'Right',data.SellItem)}`;
                }
                
                d = d.addField(`${p.name} / ${p.participant.actor}`,`${items}`);
            }
            
            channel.send(d);
            
            channel.stopTyping(true);
        };
        
        vg.getMatchDetails(matchData,callback)
        VaingloryToken.getInstance().removeMessage(message.id);
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
            for (var p of content) {
                //${p.id}
                var diff = fm.timeToNow(new Date(p.createdAt));
                d = d.addField(`${p.name}`, `Last active: ${p.createdAt}\n${diff['days']} d ${diff['hours']} h ${diff['minutes']} m `);
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

function getClassColor(classification) {
    if (classification.toLowerCase().includes("gold")) {
        return "#FFD700";
    } else if (classification.toLowerCase().includes("silver")) {
        return "#C0C0C0";
    } else if (classification.toLowerCase().includes("bronze")) {
        return "#cd7f32";
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

// export
module.exports = {
    setToken: setToken,
    getToken: getToken,
    requestPlayerDetails: requestPlayerDetails,
    requestPlayerDetailsForName: requestPlayerDetailsForName,
    requestPlayerDetailsInChannel:requestPlayerDetailsInChannel,
    requestRecentPlayedHeroes: requestRecentPlayedHeroes,
    requestRecentPlayedHeroesForName:requestRecentPlayedHeroesForName,
    requestMatch: requestMatch,
    requestMatchForPlayer: requestMatchForPlayer,
    getMatchDetails:matchDetails,
    afkInfo: afkDetails
};