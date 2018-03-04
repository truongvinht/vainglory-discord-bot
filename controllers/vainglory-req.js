// vainglory-req.js
// ================

//dependency
var request = require('request');
var fs = require('fs');
var log =require('loglevel');

var vgbase = require('../models/vainglory-base.js');

// constant
const VG_URL = 'https://api.dc01.gamelockerapp.com/shards/'

// request token for VG API
var requestToken = '';

var matchStats = function(region, player, callback) {
    //check for non-empty VG key
    var key = requestToken;
    if (key == null || key == '') {
        console.log("Error: API Key is empty");
        return null;
    }
    var requestURL = VG_URL + region + "/matches?filter[playerNames]=" + player + "&sort=-createdAt&page[limit]=1&page[offset]=0";
    console.log(requestURL);
    var reqOption = {
        url: requestURL,
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
    request(reqOption, function(error, response, body) {

        if (!error && response.statusCode == 200) {
            var json = JSON.parse(body);

            var ownPlayerID = "";
            //fetch own player id
            if (player.indexOf(',') == -1) {
                //only for single player info
                ownPlayerID = fetchPlayerID(json, player)
            }
            var totalCountGames = json.data.length;
            
            //prepare match data
            var match = fetchLastMatch(json)

            var matchContent = {};
            
            matchContent['match'] = match;
            matchContent['createdAt'] = getFormattedDate(match.createdAt);
            matchContent['duration'] = (match.duration - (match.duration % 60)) / 60;
            
            // roster for match
            var rosterLeftMap = {};
            var rosterRightMap = {};

            var text = player + ": " + getFormattedDate(match.createdAt) + "\n";

            text = text + match.gameMode + ": " + (match.duration - (match.duration % 60)) / 60 + "mins \n";

            // Helper list with all players grouped by roster
            var rosterLeft = [];
            var rosterRight = [];

            var maxScorePlayerValue = 0;
            var maxScorePlayerID = "";

            for (var rosterID of match.roster) {

                var roster = fetchRoster(json, rosterID);

                if (roster.won == "true" && roster.side == 'left/blue') {
                    matchContent["won"] = 'left/blue';
                    text = text + "Left win \n";
                } else if (roster.won == "true") {
                    text = text + "Right win \n";
                    matchContent["won"] = 'right/red';
                }
                
                //text = text + ""+roster.side+":" + "\n";
                for (var part of roster.participants) {
                    var p = fetchParticipants(json, part);

                    var mom = calculateManOfMatch(p);

                    if (maxScorePlayerValue < mom) {
                        maxScorePlayerValue = mom;
                        maxScorePlayerID = p.playerID;
                    }

                    if (roster.side == 'left/blue') {
                        rosterLeft.push(p);
                    } else if (roster.side == 'right/red') {
                        rosterRight.push(p);
                    }
                }
            }
            
            

            // prepare output
            text = text + "\nLeft:\n";

            //left
            for (var p of rosterLeft) {

                const player = fetchPlayer(json, p.playerID);
                
                var guild = "";
                
                if (player.guildTag!="") {
                    guild = "[" + player.guildTag + "]";
                }
                
                if (p.playerID == ownPlayerID) {
                    text = text + "- " + p.actor + " / " + player.name + " " + guild + " (" + p.tier + ")";
                } else {
                    text = text + "- " + p.actor + " / " + player.name + " " + guild + " (" + p.tier + ")";
                }

                if (maxScorePlayerID == p.playerID) {
                    text = text + " *";
                }

                text = text + "\n";
            }

            text = text + "\nRight:\n";

            //right
            for (var p of rosterRight) {

                const player = fetchPlayer(json, p.playerID);
                
                var guild = "";
                
                if (player.guildTag!="") {
                    guild = "[" + player.guildTag + "]";
                }
                
                if (p.playerID == ownPlayerID) {
                    text = text + "- " + p.actor + " / " + player.name + " " + guild + " (" + p.tier + ")";
                } else {
                    text = text + "- " + p.actor + " / " + player.name + " " + guild + " (" + p.tier + ")";
                }
                if (maxScorePlayerID == p.playerID) {
                    text = text + " *";
                }

                text = text + "\n";
            }

            callback(text, match.id);
            

            
            for (var included of json.included) {

                // fetch item attributes
                var attributes = included.attributes;

                if ('asset' == included.type) {
                    
                    //found asset URL
                    const assetURL = included.attributes.URL;
                    
                     var reqAssetsOption = {
                            url: assetURL,
                            headers: {
                                'User-Agent': 'request',
                                'Accept': 'application/json'
                            }
                        }
                    
                    request(reqAssetsOption, function(err, resp, assetbody) {

                        if (!err && resp.statusCode == 200) {
                            var json = JSON.parse(assetbody);
                            
                            var output = "Hero selection\n";
                            
                            var left = [];
                            var right = [];
                            
                            var leftBan = "";
                            var rightBan = "";
                            
                            for (var entry of json) {
                                if (entry.type == 'HeroBan') {
                                    if (entry.payload.Team == 1) {
                                        leftBan = "Left Ban: " + entry.payload.Hero + "\n";
                                    } else {
                                        rightBan = "Right Ban: " + entry.payload.Hero + "\n";
                                    }
                                }
                                
                                if (entry.type == 'HeroSelect') {
                                    if (entry.payload.Team == 1) {
                                        left.push(entry.payload);
                                    } else {
                                        right.push(entry.payload);
                                    }
                                }
                            }
                            
                            
                            
                            output = output + "Left: ";
                            for (var l of left) {
                                output = output + l.Hero + " ";
                            }
                            output = output + "\nRight: ";
                            for (var r of right) {
                                output = output + r.Hero + " ";
                            }
                            
                            output = leftBan + rightBan + output;
                            
                            callback(output,match.id)
                        }
                    });
                    
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
                text = response.statusCode + " " + response.headers + " " + body + " " + error;
            }
            callback(text, player);
        }
    });
}

/**
 * Getting recent played heroes
 * @private
 * @param {String|Object|Array|Boolean|Number} paramName Describe this parameter
 */
const recentPlayedHeroes = function(region, player, callback) {
    
    //check for non-empty VG key
    var key = requestToken;
    if (key == null || key == '') {
        console.log("Error: API Key is empty");
        return null;
    }

    var requestURL = VG_URL + region + "/matches?filter[playerNames]=" + player + "&sort=-createdAt";
    console.log(requestURL);
    var reqOption = {
        url: requestURL,
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
    request(reqOption, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            var json = JSON.parse(body);
            var ownPlayerID = "";
            
            //fetch own player id
            if (player.indexOf(',') == -1) {
                //only for single player info
                ownPlayerID = fetchPlayerID(json, player);
            }

            var playersMap = {};

            var text = player + ": " + "\n";
            for (var match of json.data) {
                //find my roster

                for (var rosterID of[match.relationships.rosters.data[0], match.relationships.rosters.data[1]]) {
                    //check roster
                    var roster = fetchRoster(json, rosterID.id);

                    for (var part of roster.participants) {
                        var p = fetchParticipants(json, part);
                        if (p.playerID == ownPlayerID) {
                            if (playersMap[p.actor] != undefined) {
                                playersMap[p.actor] = {
                                    "played":playersMap[p.actor].played + 1,
                                    "victory":(roster.won==="true")? playersMap[p.actor].victory+1:playersMap[p.actor].victory
                                }
                            } else {
                                playersMap[p.actor] = {
                                    "played":1,
                                    "victory":(roster.won==="true")?1:0
                                };
                            }
                            break;
                        }
                    }
                }
            }

            var playerList = [];

            for (var k of Object.keys(playersMap)) {
                playerList.push({
                    name: k,
                    value: playersMap[k]
                });
            }

            playerList.sort(function(a, b) {
                return b.value.played - a.value.played;
            });
            callback(playerList,json.data.length);
        } else {

            if (response != null) {
                log.debug("# # # # #");
                log.debug("URL: " + requestURL);
                log.debug("Status: " + response.statusCode);
                log.debug("Header: " + response.rawHeaders);
                log.debug("Body: " + body);
                log.debug("Failed: " + error);
            }
            callback([],0);
        }
    });
}



// function to get player stats
var playerStats = function(region, playerName, callback) {

    //check for non-empty VG key
    var key = requestToken;
    if (key == null || key == '') {
        console.log("Error: API Key is empty");
        return null;
    }

    var requestURL = VG_URL + region + "/players?filter[playerNames]=" + playerName;

    var reqOption = {
        url: requestURL,
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
                    "skillTier": getTier(anyPlayer.attributes.stats.skillTier),
                    "skillTierImg":vgbase.convertTier(getTier(anyPlayer.attributes.stats.skillTier)),
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

// function to get quick info about the players
var playersQuickInfo = function(region, playerNames, callback) {

    //check for non-empty VG key
    var key = requestToken;
    if (key == null || key == '') {
        console.log("Error: API Key is empty");
        return null;
    }

    //fill a batch of player names, VG allows 6 for each request
    var requestBatch = [];

    var playerRequest = "";

    if (requestBatch.length > 6) {
        //not fully implemented yet

        //limit to max 50 entries
        if (requestBatch.length > 50) {
            callback(null);
        }

        var subCallback = function(content) {
            playersQuickInfo(region, otherList, callback);
        }

        var otherList = playerNames.slice(6, playerNames.list);
        var subList = playerNames.slice(0, 6);

        //request first 6 items
        playersQuickInfo(region, subList, callback);

    } else {
        //list fits into single request
        for (var n of playerNames) {

            //init first player
            if (playerRequest.length == 0) {
                playerRequest = n;
            } else {
                playerRequest = playerRequest + "," + n;
            }
        }
    }

    var requestURL = VG_URL + region + "/players?filter[playerNames]=" + playerRequest;

    var reqOption = {
        url: requestURL,
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
                        "skillTier": getTier(anyPlayer.attributes.stats.skillTier),
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
                callback(players);
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

                participant = {
                    "id": included.id,
                    "actor": actor.replace('\*', '').replace('\*', ''),
                    "kills": attributes.stats.kills,
                    "tier": getTier(attributes.stats.skillTier),
                    "playerID": included.relationships.player.data.id,
                    "deaths": attributes.stats.deaths,
                    "assists": attributes.stats.assists,
                    "krakenCaptures": attributes.stats.krakenCaptures,
                    "turretCaptures": attributes.stats.turretCaptures,
                    "minionKills": attributes.stats.minionKills,
                    "goldMineCaptures": attributes.stats.goldMineCaptures,
                    "crystalMineCaptures": attributes.stats.crystalMineCaptures,
                    "items":attributes.stats.items
                };
            }
        }
    }
    return participant;
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
                    "skillTier": getTier(attributes.stats.skillTier),
                    "rankPoints": attributes.stats.rankPoints.ranked.toFixed(2),
                    "guildTag": attributes.stats.guildTag,
                };
                return player;
            }
        }
    }
    return null;
}


// function for parsing relevant game data
function fetchVictoryGames(json) {

    //result
    var result = null;

    var gameList = json.data;

    for (var game of gameList) {

        //fetch game information
        var attributes = game.attributes;
        var gameInfo = {
            "id": game.id,
            "createdAt": attributes.createdAt,
            "duration": attributes.duration,
            "gameMode": vgbase.getMode(attributes.gameMode),
            "queue": attributes.stats.queue
        };

        //console.log(gameInfo);
        result = gameInfo;
    }
    return result;
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

function getTier(skillTier) {
    return vgbase.getTier(skillTier);
}

// function to get formatted time stamp
function getTimeStamp(date) {
    var month = (date.getMonth() < 9) ? "0" + (date.getMonth() + 1) : (date.getMonth() + 1);
    var day = ((date.getDate() - 1) < 10) ? "0" + (date.getDate() - 1) : (date.getDate());
    return "" + date.getFullYear() + "-" + month + "-" + day + "T00:00:00Z";
}

function getFormattedDate(date) {
    return date.replace("T", " ").replace("Z", "");
}

var updateToken = function(token) {
    requestToken = token;
}

//export
module.exports = {
    getMatchStats: matchStats,
    getPlayerStats: playerStats,
    getPlayersInfo: playersQuickInfo,
    getRecentPlayedHeroes: recentPlayedHeroes,
    setToken: updateToken
};
