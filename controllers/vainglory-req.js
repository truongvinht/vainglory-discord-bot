// vainglory-req.js
// ================

//dependency
const log = require('loglevel');

// CONTROLLER
const gameMode = require('./gameMode');
const vgData = require('./vgDataSeparator');
const vgHandler = require('./vgHandler');

const vgbase = require('../models/vainglory-base.js');

// command MATCH
const matchStats = function(region, page, playerName, callback) {

    //after requesting json data
    const requestCallback = function(json) {
        if (json != null) {
            //fetch own player id
            var ownPlayerID =  vgData.findPlayerByName(json,playerName);
            var ownPlayedHero = "";
            var totalCountGames = json.data.length;

            //prepare match data
            var match = vgData.getLastMatch(json)

            //map for callback
            var matchContent = {};

            var mappingMOM = {};

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

                var roster = vgData.getRoster(json, rosterID);

                if (roster.won == "true" && roster.side == 'left/blue') {
                    matchContent["won"] = 'left/blue';
                } else if (roster.won == "true") {
                    matchContent["won"] = 'right/red';
                }

                for (var part of roster.participants) {
                    var p = vgData.getParticipant(json, part);

                    var mom = vgHandler.getMoMScore(p);

                    mappingMOM[p.playerID] = mom;
                    
                    if (maxScorePlayerValue < mom) {
                        maxScorePlayerValue = mom;
                        maxScorePlayerID = p.playerID;
                        momHero = p.actor;
                    }
                    
                    if (p.playerID == ownPlayerID) {
                        ownPlayedHero = p.actor;

                        //players team side
                        matchContent["teamSide"] = roster.side;
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

                    var player = vgData.getPlayer(json, p.playerID);//fetchPlayer(json, p.playerID);
                    player["participant"] = p;

                    if (mappingMOM[player.id] != undefined) {
                        mappingMOM[player.name] = mappingMOM[player.id];
                        delete mappingMOM[player.id];
                    }

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
            
            //log.debug(JSON.stringify(rosterLeft));
            matchContent["left"] = teamsData[0];
            matchContent["right"] = teamsData[1];
            
            manOfMatch["actor"] = momHero;
            matchContent["mom"] = manOfMatch;
            matchContent["hero"] = ownPlayedHero;
            matchContent["scores"] = mappingMOM;

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
            callback(null, null);
        }
    };
    
    //request last match (index 0, only a match is relevant)
    vgHandler.getMatch(playerName, 1, page, requestCallback);
}

/**
 * Request for match details
 * @private
 * @param {String} data with match url
 * @type Object
 */
const matchDetails = function(data, callback) {

    const requestCallback = function(json) {
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
        
        //maximal relevant events
        var maxLength = 1000;
        
        if (json.length < 1000) {
            maxLength = json.length;
        }

        var soldItems = [];
        
        // trace sold items (last 1000 actions)
        for (var entry of json.reverse().slice(0,maxLength)) {
            if (entry.type == 'SellItem') {
                soldItems.push(entry);
            } 
        }
        
        heroSelections['banned'] = {'left':leftBan,'right':rightBan};
        heroSelections['data'] = data;
        heroSelections['SellItem'] = soldItems;
        
        callback(heroSelections);
    };

    vgHandler.getMatchDetails(data, requestCallback);
}

/**
 * Method to get stats for selected match (command i within a match)
 */
const matchDetailsPlayer = (data, callback) => {

    const requestCallback = function(json) {
        var playerName = {}

            var teamLeft = {};
            var teamRight = {};
            
            for (var entry of json) {

                //ignore 
                if (entry.type == 'HeroBan' || 
                    entry.type == 'HeroSkinSelect' || 
                    entry.type == 'PlayerFirstSpawn') {
                    continue;
                }
                
                // prepare player hero selection
                if (entry.type == 'HeroSelect') {
                    
                    if (entry.payload.Team == 1) {
                        teamLeft[entry.payload.Hero] = {
                            'Player':`${entry.payload.Player}`,
                            'Ability':[],
                            'DealDamage':[],
                            'ReceiveDamage':[],
                            'Kill':[],
                            'Death':[]
                        };
                    } else {
                        teamRight[entry.payload.Hero] = {
                            'Player': `${entry.payload.Player}`,
                            'Ability':[],
                            'DealDamage':[],
                            'ReceiveDamage':[],
                            'Kill':[],
                            'Death':[]
                        };
                    }
                    playerName[entry.payload.Player] = entry.payload.Handle;
                    continue;
                }
                
                if (entry.type == 'HeroSwap') {
                    for (let p of entry.payload) {
                        if (p.Team == 1) {
                            teamLeft[p.Hero]  = {
                                'Player':`${p.Player}`,
                                'Ability':[],
                                'DealDamage':[],
                                'ReceiveDamage':[],
                                'Kill':[],
                                'Death':[]
                            };
                        } else {
                            teamRight[p.Hero]  = {
                                'Player':`${p.Player}`,
                                'Ability':[],
                                'DealDamage':[],
                                'ReceiveDamage':[],
                                'Kill':[],
                                'Death':[]
                            };
                        }
                    }
                    continue;
                }
                
                if (entry.type == 'BuyItem') {
                    continue;
                }
                
                if (entry.type == 'SellItem') {
                    continue;
                }
                
                // ability 
                if (entry.type == 'LearnAbility') {
                    
                    if (entry.payload.Team == 'Left') {
                        var hero = teamLeft[entry.payload.Actor];
                        
                        var abilityList = hero['Ability'];
                        
                        var ability = {};
                        ability['time'] = entry.time;
                        ability['Ability'] = entry.payload.Ability;
                        ability['Level'] = entry.payload.Level;
                        
                        abilityList.push(ability);
                        hero['Ability'] = abilityList;
                        
                        teamLeft[entry.payload.Actor] = hero;
                    } else {
                        var hero = teamRight[entry.payload.Actor];
                        
                        var abilityList = hero['Ability'];
                        
                        var ability = {};
                        ability['time'] = entry.time;
                        ability['Ability'] = entry.payload.Ability;
                        ability['Level'] = entry.payload.Level;
                        
                        abilityList.push(ability);
                        hero['Ability'] = abilityList;
                        
                        teamRight[entry.payload.Actor] = hero;
                    }
                    
                    continue;
                }
                
                if (entry.type == 'UseAbility') {
                    continue;
                }
                
                if (entry.type == 'GoldFromTowerKill') {
                    continue;
                }
                
                if (entry.type == 'GoldFromGoldMine') {
                    continue;
                }
                
                if (entry.type == 'GoldFromKrakenKill') {
                    continue;
                }
                
                if (entry.type == 'NPCkillNPC') {
                    continue;
                }
                
                if (entry.type == 'EarnXP' || entry.type == 'LevelUp') {
                    continue;
                }
                
                if (entry.type == 'UseItemAbility') {
                    continue;
                }
                
                if (entry.type == 'HealTarget') {
                    continue;
                }
                
                if (entry.type == 'Vampirism') {
                    continue;
                }
                
                if (entry.type == 'KillActor') {
                    
                    if (entry.payload.IsHero != 1 ||entry.payload.TargetIsHero != 1) {
                        continue;
                    }

                    var killedHero = {};
                    killedHero['Actor'] = entry.payload.Actor;
                    killedHero['Killed'] = entry.payload.Killed;
                    killedHero['KilledTeam'] = entry.payload.KilledTeam;
                    killedHero['time'] = entry.time;

                    if (entry.payload.Team == 'Left') {

                        var hero = teamLeft[entry.payload.Actor];
                        var kills = hero['Kill'];
                        kills.push(killedHero);
                        
                        var deathHero = teamRight[entry.payload.Killed];
                        var death = deathHero['Death'];
                        death.push(killedHero)
                        
                    } else {
                        var hero = teamRight[entry.payload.Actor];
                        var kills = hero['Kill'];
                        kills.push(killedHero);

                        var deathHero = teamLeft[entry.payload.Killed];
                        var death = deathHero['Death'];
                        death.push(killedHero)
                    }
                    continue;
                }
                
                if (entry.type == 'DealDamage') {

                    var damage = {};
                    damage['Actor'] = entry.payload.Actor;
                    damage['Target'] = entry.payload.Target;
                    damage['Source'] = entry.payload.Source;
                    damage['Damage'] = entry.payload.Dealt;
                    damage['Dealt'] = entry.payload.Dealt;

                    if (entry.payload.Actor == undefined || entry.payload.Actor === 'undefined') {
                        continue;
                    }
                    if (entry.payload.Team == 'Left') {
                        var hero = teamLeft[entry.payload.Actor];
                        var dealDamage = hero['DealDamage'];
                        dealDamage.push(damage);
                        
                        var opponent = teamRight[entry.payload.Target];
                        
                        if (teamRight.hasOwnProperty(entry.payload.Target)) {
                            
                            //add only hero damage
                            hero['DealDamage'] = dealDamage;
                            teamLeft[entry.payload.Actor] = hero;
                            
                            var receiveDamage = opponent['ReceiveDamage'];
                            receiveDamage.push(damage);
                            
                            opponent['ReceiveDamage'] = receiveDamage;
                            teamRight[entry.payloadTarget] = opponent;
                        }
                        
                    } else {
                        
                        var hero = teamRight[entry.payload.Actor];
                        var dealDamage = hero['DealDamage'];
                        dealDamage.push(damage);
                        
                        var opponent = teamLeft[entry.payload.Target];
                        
                        if (teamLeft.hasOwnProperty(entry.payload.Target)) {
                            //add only hero damage
                            hero['DealDamage'] = dealDamage;
                            teamRight[entry.payload.Actor] = hero;
                            
                            var receiveDamage = opponent['ReceiveDamage'];
                            receiveDamage.push(damage);
                            
                            opponent['ReceiveDamage'] = receiveDamage;
                            teamLeft[entry.payloadTarget] = opponent;
                        }
                    }
                    
                    continue;
                }
            }
            
            //set name
            for (let k of Object.keys(teamLeft)) {
                if (k == undefined || k == 'undefined') {
                    continue;
                }

                var h = teamLeft[k];
                h['name'] = playerName[h.Player];
                teamLeft[k] = h;
            }
            
            for (let k of Object.keys(teamRight)) {
                if (k == undefined || k == 'undefined') {
                    continue;
                }
                var h = teamRight[k];
                h['name'] = playerName[h.Player];
                teamRight[k] = h;
            }

            for (let k of Object.keys(teamLeft)) {
                if( k.indexOf('*') < 0){
                    delete teamLeft[k];
                }
            }

            for (let k of Object.keys(teamRight)) {
                if( k.indexOf('*') < 0){
                    delete teamRight[k];
                }
            }

            callback({'left': teamLeft, 'right': teamRight});
    };

    vgHandler.getMatchDetails(data, requestCallback);
}

// Request games for the summer event (not currently used)
const summerEvent = function(playerName, callback) {

    //after requesting json data
    const requestCallback = function(json) {

        if (json!=null) {
            var ownPlayerID = "";

            //fetch own player id
            if (playerName.indexOf(',') == -1) {
                //only for single player info
                ownPlayerID = vgData.findPlayerByName(json, playerName);
            }

            var playedGameMode = {};

            for (var match of json.data) {
                
                //collect game mode data
                const gMode = match.attributes.gameMode;//vgbase.getMode(match.attributes.gameMode);
                
                const m = vgData.getSingleMatch(match);

                for (const roster of m.roster) {
                    const r = vgData.getRoster(json, roster);

                    for (const participant of r.participants) {
                        const p = vgData.getParticipant(json, participant);

                        if (ownPlayerID == p.playerID) {
                            if (r.won == 'true') {
                                if (playedGameMode.hasOwnProperty(`${gMode}`)) {
                                    playedGameMode[`${gMode}`] = playedGameMode[`${gMode}`] + 1;
                                } else {
                                    playedGameMode[`${gMode}`] = 1;
                                }
                            }
                        }
                    }
                }
            }
            callback(playerName, playedGameMode);
        } else {
            callback(playerName,null);
        }
    };
    //request based last matches
    vgHandler.getMatchesFromDate(playerName,"2018-06-20T02:00:00Z",requestCallback);
}

/**
 * Getting recent played heroes (command RECENT)
 */
const recentPlayedHeroes = function(region, player, callback) {

    //after requesting json data
    const requestCallback = function(json) {

        if (json!=null) {
            var ownPlayerID = "";

            //fetch own player id
            if (player.indexOf(',') == -1) {
            //only for single player info
                ownPlayerID = vgData.findPlayerByName(json, player);
            }

            const collectedData = collectMatchData(ownPlayerID,json.data, json);

            var heroSelectionMap = collectedData.heroSelectionMap;
            var playerMatchingMap = collectedData.playerMatchingMap;
            
            var roles = collectedData.roles;

            //collect match starting time
            var playedTime = collectedData.playedTime;

            var playedGameMode = collectedData.playedGameMode;

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
                var playerData = vgData.getPlayer(json,p);//fetchPlayer(json,p);
            
                playerList.push({
                    name: playerData.name,
                    value: playerMatchingMap[p],

                });
            }
            
            playerList.sort(function(a, b) {
                return b.value.played - a.value.played;
            });
            
            //fetch player names
            callback(heroesList, playerList, json.data.length, roles, playedGameMode, playedTime);
        } else {
            callback([], 0);
        }

    };

    //request based on 50 last matches
    vgHandler.getMatch(player,50,0,requestCallback);
}

function collectMatchData(ownPlayerID, matches, json) {

    var heroSelectionMap = {};
    var playerMatchingMap = {};
    
    var roles = {"Carry":0,
                "Jungler":0,
                "Captain":0};

    //collect match starting time
    var playedTime = {};

    var playedGameMode = {};

    for (var match of matches) {
        //find my roster
        const hour = new Date(match.attributes.createdAt).getHours();

        if (playedTime.hasOwnProperty(hour)) {
            playedTime[hour] = playedTime[hour] + 1;
        } else {
            playedTime[hour] = 1;
        }

        const rosterA = match.relationships.rosters.data[0];
        const rosterB = match.relationships.rosters.data[1];
        
        //collect game mode data
        const gMode = vgbase.getMode(match.attributes.gameMode);
        
        if (playedGameMode.hasOwnProperty(`${gMode}`)) {
            playedGameMode[`${gMode}`] = playedGameMode[`${gMode}`] + 1;
        } else {
            playedGameMode[`${gMode}`] = 1;
        }
    
        //helper list with both roster
        let rosterSides = [vgData.getRoster(json, rosterA.id),vgData.getRoster(json, rosterB.id)];
        
        for (var roster of rosterSides) {
            
            var teamsData = [];
            
            for (var part of roster.participants) {
                teamsData.push(vgData.getParticipant(json, part));
            }
            
            for (let matchType of gameMode.getData().relevant) {
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
                    
                    //check for players which are played in the same team
                    let ownPlayer = teamsData.find(function (pl){
                        return pl.playerID == ownPlayerID;
                    });

                    if (ownPlayer == null||ownPlayer == undefined) {
                        continue;
                    } 

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

    var dataMap = {};
    dataMap['heroSelectionMap'] = heroSelectionMap;
    dataMap['playerMatchingMap'] = playerMatchingMap;
    dataMap['roles'] = roles;
    dataMap['playedTime'] = playedTime;
    dataMap['playedGameMode'] = playedGameMode;

    return dataMap;
}

// command RECENT played games
const playedGames = function(player, callback) {

    //after requesting json data
    const requestCallback = function(json) {
        if (json!=null) {
            var ownPlayerID = "";

            //fetch own player id
            if (player.indexOf(',') == -1) {
            //only for single player info
                ownPlayerID = vgData.findPlayerByName(json, player);
            }

            // map with matches grouped by game mode
            var matchesMap = {};

            for (var match of json.data) {

                if (matchesMap.hasOwnProperty(match.attributes.gameMode)) {
                    matchesMap[match.attributes.gameMode].push(match);
                } else {
                    matchesMap[match.attributes.gameMode] = [match];
                }
            }

            var resultMap = {};

            for (var type of Object.keys(matchesMap)) {
                //console.log(type +": " + matchesMap[type].length);

                const collectedData = collectMatchData(ownPlayerID,matchesMap[type], json);

                var heroSelectionMap = collectedData.heroSelectionMap;
                var playerMatchingMap = collectedData.playerMatchingMap;
                
                var roles = collectedData.roles;
    
                //collect match starting time
                var playedTime = collectedData.playedTime;
    
                var playedGameMode = collectedData.playedGameMode;

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

                resultMap[type] = {'heroesList':heroesList,'length':matchesMap[type].length,'roles':roles};
            }
            callback(player, resultMap);
        }
    };
    //request based on 50 last matches
    vgHandler.getMatch(player,50,0,requestCallback);
}

// command PLAYER
const playerStats = function(region, playerName, callback) {

    //after requesting json data
    const requestCallback = function(json) {
        if (json!=null) {
            if (json.data.length > 0) {

                //parse first item
                const anyPlayer = json.data[0];

                var guildTag = "";
                if (anyPlayer.attributes.stats.hasOwnProperty('guildTag')) {
                    guildTag = anyPlayer.attributes.stats.guildTag;
                }
                
                var blitzRank = 0;
                var rankedRank = 0;
                var ranked5v5Rank = 0;
                
                if (anyPlayer.attributes.stats.hasOwnProperty("rankPoints")) {
                    if (anyPlayer.attributes.stats.rankPoints.hasOwnProperty("blitz")) {
                        blitzRank = anyPlayer.attributes.stats.rankPoints.blitz;
                    }
                    
                    if (anyPlayer.attributes.stats.rankPoints.hasOwnProperty("ranked")) {
                        rankedRank = anyPlayer.attributes.stats.rankPoints.ranked;
                    }
                    
                    if (anyPlayer.attributes.stats.rankPoints.hasOwnProperty("ranked_5v5")) {
                        ranked5v5Rank = anyPlayer.attributes.stats.rankPoints.ranked_5v5;
                    }
                }
                
                const player = {
                    "id": anyPlayer.id,
                    "shardId":anyPlayer.attributes.shardId,
                    "name": anyPlayer.attributes.name,
                    "skillTier": vgbase.getTier(anyPlayer.attributes.stats.skillTier),
                    "skillTierImg": vgbase.convertTier(vgbase.getTier(anyPlayer.attributes.stats.skillTier)),
                    "rankPoints": {
                        "blitz": blitzRank.toFixed(2),
                        "ranked": rankedRank.toFixed(2),
                        "ranked_5v5": ranked5v5Rank.toFixed(2)
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
            callback(playerName, null);
        }
    };
    vgHandler.getPlayer(playerName,requestCallback);
}
// command AFK
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
    
    //after requesting json data
    const requestCallback = function(json) {
        if (json!=null) {
            if (json.data.length > 0) {

                var players = [];

                for (var anyPlayer of json.data) {

                    var guildTag = "";
                    if (anyPlayer.attributes.stats.hasOwnProperty('guildTag')) {
                        guildTag = anyPlayer.attributes.stats.guildTag;
                    }

                    var blitzRank = 0;
                
                    if (anyPlayer.attributes.stats.rankPoints.hasOwnProperty("blitz")) {
                        blitzRank = anyPlayer.attributes.stats.rankPoints.blitz;
                    }
                
                    var rankedRank = 0;
                
                    if (anyPlayer.attributes.stats.rankPoints.hasOwnProperty("ranked")) {
                        rankedRank = anyPlayer.attributes.stats.rankPoints.ranked;
                    }
                
                    var ranked5v5Rank = 0;
                
                    if (anyPlayer.attributes.stats.rankPoints.hasOwnProperty("ranked_5v5")) {
                        ranked5v5Rank = anyPlayer.attributes.stats.rankPoints.ranked_5v5;
                    }

                    const player = {
                        "id": anyPlayer.id,
                        "shardId":anyPlayer.shardId,
                        "name": anyPlayer.attributes.name,
                        "skillTier": vgbase.getTier(anyPlayer.attributes.stats.skillTier),
                        "rankPoints": {
                            "blitz": blitzRank.toFixed(2),
                            "ranked": rankedRank.toFixed(2),
                            "ranked_5v5": ranked5v5Rank.toFixed(2)
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
            }
        }
    };
    vgHandler.getPlayer(playerRequest,requestCallback);
}

function getRolesForParticipants(participantList) {
    
    //check whether game mode has these information
    if (!gameMode.getData().composition.hasOwnProperty(`${participantList.length}`)) {
        return participantList;
    }
    
    const config = gameMode.getData().composition[`${participantList.length}`];
    
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

const updateToken = function(token) {
    vgHandler.setToken(token);
}

//export
module.exports = {
    getMatchStats: matchStats,
    getPlayerStats: playerStats,
    getPlayersInfo: playersQuickInfo,
    getRecentPlayedHeroes: recentPlayedHeroes,
    getPlayedGame: playedGames,
    getSummerEvent: summerEvent,
    getMatchDetails: matchDetails,
    getMatchDetailsForPlayer: matchDetailsPlayer,
    setToken: updateToken
};