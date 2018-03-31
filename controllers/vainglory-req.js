// vainglory-req.js
// ================

//dependency
var request = require('request');
var fs = require('fs');
var log = require('loglevel');


// CONTROLLER
const itemHandler = require('./itemHandler');

// CONFIG
const gameMode = require('../data/gameMode.json');

var vgbase = require('../models/vainglory-base.js');

// URL for Vainglory developer API
const VG_URL = 'https://api.dc01.gamelockerapp.com/shards/'

// request token for VG API
var requestToken = '';

var matchStats = function(region, playerName, callback) {
    const requestURL = VG_URL + region + "/matches?filter[playerNames]=" + playerName + "&sort=-createdAt&page[limit]=1&page[offset]=0";
    log.debug(requestURL);

    const reqOption = getRequestHeader(requestURL);

    if (reqOption == null) {
        return null;
    }

    request(reqOption, function(error, response, body) {

        if (!error && response.statusCode == 200) {
            var json = JSON.parse(body);

            //fetch own player id
            var ownPlayerID = fetchPlayerID(json, playerName);
            var ownPlayedHero = "";
            var totalCountGames = json.data.length;

            //prepare match data
            var match = fetchLastMatch(json)

            //map for callback
            var matchContent = {};

            matchContent['match'] = match;
            matchContent['createdAt'] = match.createdAt;
            matchContent['duration'] = (match.duration - (match.duration % 60)) / 60;

            // Helper list with all players grouped by roster
            var rosterLeft = [];
            var rosterRight = [];

            var maxScorePlayerValue = 0;
            var maxScorePlayerID = "";
            var manOfMatch = null;
            var momHero = null;
            
            for (var rosterID of match.roster) {

                var roster = fetchRoster(json, rosterID);

                if (roster.won == "true" && roster.side == 'left/blue') {
                    matchContent["won"] = 'left/blue';
                } else if (roster.won == "true") {
                    matchContent["won"] = 'right/red';
                }

                for (var part of roster.participants) {
                    var p = fetchParticipants(json, part);

                    var mom = calculateManOfMatch(p);

                    if (maxScorePlayerValue < mom) {
                        maxScorePlayerValue = mom;
                        maxScorePlayerID = p.playerID;
                        momHero = p.actor;
                    }
                    
                    if (p.playerID == ownPlayerID) {
                        ownPlayedHero = p.actor;
                    }

                    if (roster.side == 'left/blue') {
                        rosterLeft.push(p);
                    } else if (roster.side == 'right/red') {
                        rosterRight.push(p);
                    }
                }
            }
            
            //helper list with both roster
            let rosterSides = [rosterLeft,rosterRight];
            
            var teamsData = [[],[]];
            
            var objCount = 0;
            
            for (let side of rosterSides) {
                for (var p of side) {

                    var player = fetchPlayer(json, p.playerID);
                    player["participant"] = p;
                    teamsData[objCount].push(player);
                    var guild = "";

                    if (player.guildTag != "") {
                        guild = "[" + player.guildTag + "]";
                    }
                
                    // man of the match
                    if (maxScorePlayerID == p.playerID) {
                        manOfMatch = player;
                    }
                }
            
                //increase for next roster
                objCount = objCount + 1;
            }
            
        
            //console.log(JSON.stringify(rosterLeft));
            //console.log(JSON.stringify(teamsData[0]));
            matchContent["left"] = teamsData[0];
            matchContent["right"] = teamsData[1];
            
            manOfMatch["actor"] = momHero;
            matchContent["mom"] = manOfMatch;
            matchContent["hero"] = ownPlayedHero;


            //continue with hero pick
            for (var included of json.included) {

                // fetch item attributes
                var attributes = included.attributes;

                if ('asset' == included.type) {

                    //found asset URL
                    const assetURL = included.attributes.URL;
                    
                    matchContent["asset"] = assetURL;
                    
                    // show match details
                    callback("", matchContent);
                    break;
                }
            }

        } else {
            var text = "";

            if (response != null) {
                log.debug("# # # # #");
                log.debug("URL: " + requestURL);
                log.debug("Status: " + response.statusCode);
                log.debug("Header: " + response.rawHeaders);
                log.debug("Body: " + body);
                log.debug("Failed: " + error);
                
                if (response.statusCode==404) {
                    callback(null, player);
                    return;
                } else {
                    text = response.statusCode + " " + response.headers + " " + body + " " + error;
                }
            }
            callback(text, player);
        }
    });
}

/**
 * Request for match details
 * @private
 * @param {String} data with match url
 * @type Object
 */
const matchDetails = function(data, callback) {
    var reqAssetsOption = {
        url: data.asset,
        headers: {
            'User-Agent': 'request',
            'Accept': 'application/json'
        }
    }

    request(reqAssetsOption, function(err, resp, assetbody) {

        if (!err && resp.statusCode == 200) {
            var json = JSON.parse(assetbody);
            var leftBan = [];
            var rightBan = [];
            var left = [];
            var right = [];
            
            var heroSelections = {};
            
            var bannedHero = {};
            
            for (var entry of json) {
                if (entry.type == 'HeroBan') {
                    if (entry.payload.Team == 1) {
                        leftBan.push(entry.payload.Hero);
                    } else {
                        rightBan.push(entry.payload.Hero);
                    }
                }
                if (entry.type == 'HeroSelect') {
                    if (entry.payload.Team == 1) {
                        left.push(entry.payload);
                    } else {
                        right.push(entry.payload);
                    }
                }
                
                //skip every other object
                if (entry.typ == 'PlayerFirstSpawn') {
                    break;
                }
            }
            
            heroSelections['left'] = left;
            heroSelections['right'] = right;
            
            var maxLength = 100;
            
            if (json.length < 100) {
                maxLength = json.length;
            }
            
            var soldItems = [];
            
            // trace sold items
            for (var entry of json.reverse().slice(0,maxLength)) {
                if (entry.type == 'SellItem') {
                    soldItems.push(entry);
                }
            }
            
            heroSelections['banned'] = {'left':leftBan,'right':rightBan};
            heroSelections['data'] = data;
            heroSelections['SellItem'] = soldItems;
            //log.error(JSON.stringify(heroSelections))
            
            callback(heroSelections)
        }
    });
}

/**
 * Getting recent played heroes
 * @private
 * @param {String|Object|Array|Boolean|Number} paramName Describe this parameter
 */
const recentPlayedHeroes = function(region, player, callback) {

    var requestURL = VG_URL + region + "/matches?filter[playerNames]=" + player + "&sort=-createdAt";
    console.log(requestURL);
    const reqOption = getRequestHeader(requestURL);
    
    if (reqOption==null) {
        return null;
    }

    request(reqOption, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            var json = JSON.parse(body);
            var ownPlayerID = "";

            //fetch own player id
            if (player.indexOf(',') == -1) {
                //only for single player info
                ownPlayerID = fetchPlayerID(json, player);
            }

            var heroSelectionMap = {};
            var playerMatchingMap = {};
            
            var roles = {"Carry":0,"Jungler":0,"Captain":0};

            var text = player + ": " + "\n";
            for (var match of json.data) {
                //find my roster
                
                const rosterA = match.relationships.rosters.data[0];
                const rosterB = match.relationships.rosters.data[1];

            
                //helper list with both roster
                let rosterSides = [fetchRoster(json, rosterA.id),fetchRoster(json, rosterB.id)];
                
                for (var roster of rosterSides) {
                    
                    var teamsData = [];
                    
                     for (var part of roster.participants) {
                         teamsData.push(fetchParticipants(json, part));
                     }
                    
                    for (let matchType of gameMode.relevant) {
                        if (matchType === match.attributes.gameMode) {
                            teamsData = getRolesForParticipants(teamsData);
                            break;
                        }
                    }
                    
                    for (var p of teamsData) {
                        
                        if (p.playerID == ownPlayerID) {
                            
                            if (roles.hasOwnProperty(p.role)) {
                                roles[p.role] = roles[p.role] + 1;
                            }
                            
                            
                            if (heroSelectionMap[p.actor] != undefined) {
                                let victory = heroSelectionMap[p.actor].victory;
                                
                                heroSelectionMap[p.actor] = {
                                    "played": heroSelectionMap[p.actor].played + 1,
                                    "victory": (roster.won === "true") ? victory + 1 : victory
                                }
                            } else {
                                heroSelectionMap[p.actor] = {
                                    "played": 1,
                                    "victory": (roster.won === "true") ? 1 : 0
                                };
                            }
                            continue;
                        } else {
                            
                            if (playerMatchingMap[p.playerID] != undefined) {
                                let victory = playerMatchingMap[p.playerID].victory;
                                
                                playerMatchingMap[p.playerID] = {
                                    "played": playerMatchingMap[p.playerID].played + 1,
                                    "victory": (roster.won === "true") ? victory + 1 : victory
                                }
                            } else {
                                playerMatchingMap[p.playerID] = {
                                    "played": 1,
                                    "victory": (roster.won === "true") ? 1 : 0
                                };
                            }
                        }
                    }
                }
            }

            var heroesList = [];

            for (var k of Object.keys(heroSelectionMap)) {
                heroesList.push({
                    name: k,
                    value: heroSelectionMap[k]
                });
            }

            heroesList.sort(function(a, b) {
                return b.value.played - a.value.played;
            });
            
            var playerList = [];

            for (var p of Object.keys(playerMatchingMap)) {
                var playerData = fetchPlayer(json,p);
            
                playerList.push({
                    name: playerData.name,
                    value: playerMatchingMap[p],

                });
            }
            
            playerList.sort(function(a, b) {
                return b.value.played - a.value.played;
            });
            
            //fetch player names
            callback(heroesList, playerList, json.data.length, roles);
            
        } else {

            if (response != null) {
                log.debug("# # # # #");
                log.debug("URL: " + requestURL);
                log.debug("Status: " + response.statusCode);
                log.debug("Header: " + response.rawHeaders);
                log.debug("Body: " + body);
                log.debug("Failed: " + error);
            }
            callback([], 0);
        }
    });
}


// function to get player stats
var playerStats = function(region, playerName, callback) {

    var requestURL = VG_URL + region + "/players?filter[playerNames]=" + playerName;
    const reqOption = getRequestHeader(requestURL);
    
    if (reqOption==null) {
        return null;
    }

    request(reqOption, function(error, response, body) {

        if (!error && response.statusCode == 200) {
            var json = JSON.parse(body);

            if (json.data.length > 0) {

                //parse first item
                const anyPlayer = json.data[0];

                var guildTag = "";
                if (anyPlayer.attributes.stats.hasOwnProperty('guildTag')) {
                    guildTag = anyPlayer.attributes.stats.guildTag;
                }

                var player = {
                    "id": anyPlayer.id,
                    "name": anyPlayer.attributes.name,
                    "skillTier": vgbase.getTier(anyPlayer.attributes.stats.skillTier),
                    "skillTierImg": vgbase.convertTier(vgbase.getTier(anyPlayer.attributes.stats.skillTier)),
                    "rankPoints": {
                        "blitz": anyPlayer.attributes.stats.rankPoints.blitz.toFixed(2),
                        "ranked": anyPlayer.attributes.stats.rankPoints.ranked.toFixed(2)
                    },
                    "createdAt": anyPlayer.attributes.createdAt,
                    "gamesPlayed": anyPlayer.attributes.stats.gamesPlayed,
                    "karmaLevel": anyPlayer.attributes.stats.karmaLevel,
                    "guildTag": guildTag,
                    "level": anyPlayer.attributes.stats.level,
                    "wins": anyPlayer.attributes.stats.wins,
                    "xp": anyPlayer.attributes.stats.xp
                };
                callback(playerName, player);
            } else {
                // no result
                callback(playerName, null);
            }

        } else {

            if (response != null) {
                log.debug("# # # # #");
                log.debug("URL: " + requestURL);
                log.debug("Status: " + response.statusCode);
                log.debug("Header: " + response.rawHeaders);
                log.debug("Body: " + body);
                log.debug("Failed: " + error);
            }
            callback(playerName, null);
        }
    });
}

const playersQuickInfo = function(region, playerNames, callback, resultList) {

    //fill a batch of player names, VG allows 6 for each request
    var remainingList = null;

    var currentNames = playerNames;

    var playerRequest = "";

    if (playerNames.length > 6) {

        const subCallback = function(content) {
            playersQuickInfo(region, otherList, callback);
        }

        remainingList = playerNames.slice(6, playerNames.list);
        
        //slice max 6 entries
        currentNames = playerNames.slice(0, 6);
    } 
    

    //list fits into single request
    for (var n of currentNames) {

        //init first player
        if (playerRequest.length == 0) {
            playerRequest = n;
        } else {
            playerRequest = playerRequest + "," + n;
        }
    }
    
    const requestURL = VG_URL + region + "/players?filter[playerNames]=" + playerRequest;
    const reqOption = getRequestHeader(requestURL);
    
    if (reqOption==null) {
        return null;
    }
    request(reqOption, function(error, response, body) {

        if (!error && response.statusCode == 200) {

            //body content
            var json = JSON.parse(body);

            if (json.data.length > 0) {

                var players = [];

                for (var anyPlayer of json.data) {

                    var guildTag = "";
                    if (anyPlayer.attributes.stats.hasOwnProperty('guildTag')) {
                        guildTag = anyPlayer.attributes.stats.guildTag;
                    }

                    var player = {
                        "id": anyPlayer.id,
                        "name": anyPlayer.attributes.name,
                        "skillTier": vgbase.getTier(anyPlayer.attributes.stats.skillTier),
                        "rankPoints": {
                            "blitz": anyPlayer.attributes.stats.rankPoints.blitz.toFixed(2),
                            "ranked": anyPlayer.attributes.stats.rankPoints.ranked.toFixed(2)
                        },
                        "createdAt": anyPlayer.attributes.createdAt,
                        "gamesPlayed": anyPlayer.attributes.stats.gamesPlayed,
                        "karmaLevel": anyPlayer.attributes.stats.karmaLevel,
                        "guildTag": guildTag,
                        "level": anyPlayer.attributes.stats.level,
                        "wins": anyPlayer.attributes.stats.wins,
                        "xp": anyPlayer.attributes.stats.xp
                    };
                    players.push(player);
                }

                if (resultList!=null) {
                    players = players.concat(resultList);
                }
                
                
                players.sort(function(b, a) {
                    return new Date(b.createdAt) - new Date(a.createdAt);
                });
                
                if (remainingList!= null) {
                    playersQuickInfo(region,remainingList,callback,players);
                } else {
                    callback(players);
                }
            } else {
                if (response != null) {
                    log.debug("# # # # #");
                    log.debug("URL: " + requestURL);
                    log.debug("Status: " + response.statusCode);
                    log.debug("Header: " + response.rawHeaders);
                    log.debug("Body: " + body);
                    log.debug("Failed: " + error);
                }
            }
        }
    });
}

// function for getting latest match
function fetchLastMatch(json) {

    var latestMatch = null;

    for (var game of json.data) {

        //fetch game information
        var attributes = game.attributes;

        if (latestMatch == null) {
            latestMatch = prepareMatchContent(game);
        } else {
            // check whether we already got the latest match
            if (latestMatch.createdAt < attributes.createdAt) {
                latestMatch = prepareMatchContent(game);
            }
        }
    }
    return latestMatch;
}

function prepareMatchContent(game) {

    var roster1 = game.relationships.rosters.data[0];
    var roster2 = game.relationships.rosters.data[1];

    var gameInfo = {
        "id": game.id,
        "createdAt": game.attributes.createdAt,
        "duration": game.attributes.duration,
        "gameMode": vgbase.getMode(game.attributes.gameMode),
        "queue": game.attributes.stats.queue,
        "roster": [roster1.id, roster2.id]
    };
    //console.log(JSON.stringify(game));
    return gameInfo;
}


// function to fetch all objects for given ID
function fetchRoster(json, rosterID) {

    var roster = null;


    for (var included of json.included) {

        // fetch item attributes
        var attributes = included.attributes;

        if ('roster' == included.type && rosterID == included.id) {
            var list = [];

            for (var p of included.relationships.participants.data) {
                list.push(p.id);
            }

            roster = {
                "id": included.id,
                "side": attributes.stats.side,
                "participants": list,
                "won": attributes.won
            };
        }
    }
    return roster;
}

//function to fetch all participants for given ID
function fetchParticipants(json, participantID) {

    var participant = null;

    for (var included of json.included) {

        // fetch item attributes
        var attributes = included.attributes;

        if ('participant' == included.type) {
            if (participantID == included.id) {

                var actor = attributes.actor;
                
                var itemCategory = {'1':0,"2":0,"3":0,"4":0,"5":0};
                
                for (let i of attributes.stats.items) {
                    let itemObject = itemHandler.getItemByName(i);
                    
                    if (itemObject != null) {
                        for (let category of itemObject.category) {
                            itemCategory[category] = itemCategory[category] + 1;
                        }
                    }
                }
                
                

                participant = {
                    "id": included.id,
                    "actor": actor.replace('\*', '').replace('\*', ''),
                    "kills": attributes.stats.kills,
                    "tier": vgbase.getTier(attributes.stats.skillTier),
                    "playerID": included.relationships.player.data.id,
                    "deaths": attributes.stats.deaths,
                    "assists": attributes.stats.assists,
                    "krakenCaptures": attributes.stats.krakenCaptures,
                    "turretCaptures": attributes.stats.turretCaptures,
                    "minionKills": attributes.stats.minionKills,
                    "jungleKills":attributes.stats.jungleKills,
                    "nonJungleMinionKills":attributes.stats.nonJungleMinionKills,
                    "goldMineCaptures": attributes.stats.goldMineCaptures,
                    "crystalMineCaptures": attributes.stats.crystalMineCaptures,
                    "wentafk":attributes.stats.wentAfk,
                    "skinKey": attributes.stats.skinKey,
                    "items": attributes.stats.items,
                    "itemstats": itemCategory
                };
            }
        }
    }
    return participant;
}

function getRolesForParticipants(participantList) {
    
    //check whether game mode has these information
    if (!gameMode.composition.hasOwnProperty(`${participantList.length}`)) {
        return participantList;
    }
    
    
    const config = gameMode.composition[`${participantList.length}`];
    
    var memberList = participantList;
    
    memberList.sort(function(a, b) {
        return b.nonJungleMinionKills - a.nonJungleMinionKills;
    });
    
    var counting = 0;
    
    for (var p of memberList) {
        
        let number = config['Carry'];
        
        if (counting < number) {
            counting = counting + 1;
            p["role"] = "Carry";
        } else {
            p["role"] = "Captain";
        }
    }
    
    
    counting = 0;
    
    memberList.sort(function(a, b) {
        return b.jungleKills - a.jungleKills;
    });
    for (var p of memberList) {
        
        let number = config['Jungler'];
        
        if (counting < number) {
            
            //skip carry
            if (p.role === "Carry") {
                continue;
            }
            
            counting = counting + 1;
            p["role"] = "Jungler";
        } else {
            break;
        }
    }
    
    return memberList;
}


function fetchPlayerID(json, playerName) {

    for (var included of json.included) {

        // fetch item attributes
        var attributes = included.attributes;

        if ('player' == included.type) {
            if (playerName == attributes.name) {
                return included.id;
            }
        }
    }
    return null;
}

function fetchPlayer(json, playerId) {

    for (var included of json.included) {
        // fetch item attributes
        var attributes = included.attributes;
        if ('player' == included.type) {
            if (playerId == included.id) {
                var player = {
                    "id": included.id,
                    "name": attributes.name,
                    "skillTier": vgbase.getTier(attributes.stats.skillTier),
                    "guildTag": attributes.stats.guildTag,
                };
                
                //prevent broken data for rank points
                if (attributes.stats.hasOwnProperty('rankPoints')) {
                    if (attributes.stats.rankPoints.hasOwnProperty('ranked')) {
                        player["rankPoints"] = attributes.stats.rankPoints.ranked.toFixed(2);
                    }
                }
                
                return player;
            }
        }
    }
    return null;
}


function countGameTypes(gameList, type) {
    var count = 0;

    for (var game of gameList) {
        if (game.gameMode === type) {
            count = count + 1;
        }
    }
    return count;
}

/**
 *  function for calculating man of the match based on game details
 */
function calculateManOfMatch(details) {
    // hero kills
    var sumKills = details.kills * 300;

    // deaths
    var sumDeaths = details.deaths * 300;

    // assist
    var sumAssists = details.assists * 300;

    // kraken captured
    var sumKraken = details.krakenCaptures * 500;

    //turrets destroyed
    var sumTurret = details.turretCaptures * 300;

    // minions killed
    var sumMinion = details.minionKills * 10;

    // captured gold miner
    var sumGoldMiner = details.goldMineCaptures * 400;

    // captured crystal miner
    var sumCrystalMiner = details.crystalMineCaptures + 300;

    return sumKills - sumDeaths + sumAssists + sumKraken + sumTurret + sumMinion + sumGoldMiner + sumCrystalMiner;
}

// function to get formatted time stamp
function getTimeStamp(date) {
    var month = (date.getMonth() < 9) ? "0" + (date.getMonth() + 1) : (date.getMonth() + 1);
    var day = ((date.getDate() - 1) < 10) ? "0" + (date.getDate() - 1) : (date.getDate());
    return "" + date.getFullYear() + "-" + month + "-" + day + "T00:00:00Z";
}

var updateToken = function(token) {
    requestToken = token;
}

/**
 * Method for generating header for request
 * @private
 * @param {String} url url for request
 * @returns header with request information
 * @type Object
 */
function getRequestHeader(url) {
    //check for non-empty VG key
    var key = requestToken;
    if (key == null || key == '') {
        log.error("Error: API Key is empty");
        return null;
    }

    return {
        url: url,
        headers: {
            'User-Agent': 'request',
            'Authorization': key,
            'X-TITLE-ID': 'semc-vainglory',
            'Accept': 'application/json',
            'Cache-Control': 'private, no-cache, no-store, must-revalidate',
            'Expires': '-1',
            'Pragma': 'no-cache'
        }
    };
}

//export
module.exports = {
    getMatchStats: matchStats,
    getPlayerStats: playerStats,
    getPlayersInfo: playersQuickInfo,
    getRecentPlayedHeroes: recentPlayedHeroes,
    getMatchDetails: matchDetails,
    setToken: updateToken
};
