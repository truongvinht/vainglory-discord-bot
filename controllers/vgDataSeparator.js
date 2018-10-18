// vgDataSeparator.js
// Handle requested data and filter 
// ==================

const vgbase = require('../models/vainglory-base.js');

// CONTROLLER
const itemHandler = require('./itemHandler');

/**
 * Method getting players data
 * @param {Object} json full json object with all data 
 * @param {String} playerId looking player ID 
 * @returns map with selected player data
 * @type Object
 */
const player = (json, playerId) => {
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
                        
                        if (attributes.stats.rankPoints.hasOwnProperty("ranked")) {
                            player["rankPoints"] = attributes.stats.rankPoints.ranked.toFixed(2);
                        }
                        
                        if (attributes.stats.rankPoints.hasOwnProperty("ranked_5v5")) {
                            player["ranked_5v5"] = attributes.stats.rankPoints.ranked_5v5.toFixed(2);
                        }

                        if (attributes.stats.rankPoints.hasOwnProperty("blitz")) {
                            player["blitz"] = attributes.stats.rankPoints.blitz.toFixed(2);
                        }

                    }
                }
                return player;
            }
        }
    }
    return null;
}

/**
 * Method for finding player ID based on player name
 * @param {Object} json full json object with all data 
 * @param {String} playerName input name for searching 
 * @returns player id if found, or else return null
 * @type String
 */
const playerID = (json, playerName) => {
    for (var included of json.included) {
        // fetch item attributes
        const attributes = included.attributes;

        if ('player' == included.type) {
            if (playerName == attributes.name) {
                return included.id;
            }
        }
    }
    return null;
}

/**
 * Method getting roster data
 * @param {Object} json full json object with all data 
 * @param {String} rosterID looking roster ID 
 * @returns map with selected roster data
 * @type Object
 */
const roster = (json, rosterID) => {

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

/**
 * Method getting participant data
 * @param {Object} json full json object with all data 
 * @param {String} participantID looking participant ID 
 * @returns map with selected participant data
 * @type Object
 */
const participant = (json, participantID) => {

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

// function for getting latest match
const lastMatch = (json) =>  {
    var latestMatch = null;
    for (var game of json.data) {
        //fetch game information
        const attributes = game.attributes;

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

const singleMatch = (game) => {
    var match = null;

    //fetch game information
    const attributes = game.attributes;

    if (match == null) {
        match = prepareMatchContent(game);
    } else {
        // check whether we already got the latest match
        if (match.createdAt < attributes.createdAt) {
            match = prepareMatchContent(game);
        }
    }
    return match;
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
    
    return gameInfo;
}

//export
module.exports = {
    getPlayer: player,
    findPlayerByName: playerID,
    getRoster: roster,
    getParticipant: participant,
    getLastMatch: lastMatch,
    getSingleMatch: singleMatch
};
