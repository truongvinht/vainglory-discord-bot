// vgHandler.js
// Handle request to vainglory api
// ==================

//dependency
var request = require('request');
var fs = require('fs');
var log = require('loglevel');

// CONTROLLER
const itemHandler = require('./itemHandler');
const gameMode = require('./gameMode');

const vgbase = require('../models/vainglory-base.js');
const c = require("../general/constLoader");

// URL for Vainglory developer API
const VG_URL = 'https://api.dc01.gamelockerapp.com/shards/'
//const VG_URL = 'http://localhost:8080/'

// request token for VG API
var requestToken = '';

// MATCH
const match = (playerName, limit, index, callback) => {
    getMatchForPlayer(playerName, limit, index, c.vgRegionList(), callback);
}

function getMatchForPlayer(playerName, limit, index, regions, callback) {

    if (regions.length > 0) {
        const requestURL = VG_URL + regions[0] + "/matches?filter[playerNames]=" + playerName + "&sort=-createdAt&page[limit]="+limit+"&page[offset]=" + index;
        log.debug(requestURL);
    
        const reqOption = getRequestHeader(requestURL);
        if (reqOption == null) {
            return null;
        }
    
        request(reqOption, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                callback(JSON.parse(body));
            } else {
                if (regions.length==1) {
                    callback(null);
                } else {
                    getMatchForPlayer(playerName, limit, index, regions.slice(1,regions.length-1), callback);
                }

            }
        });
    } else {
        callback(null);
    }
}

// MATCH DETAILS
const matchDetails = (data, callback) => {
    var reqAssetsOption = {
        url: data.asset,
        headers: {
            'User-Agent': 'request',
            'Accept': 'application/json'
        }
    }

    request(reqAssetsOption, function(err, resp, assetbody) {

        if (!err && resp.statusCode == 200) {
            callback(JSON.parse(assetbody));
        }
    });
}

// PLAYER
const player = (playerName, callback) => {
    getPlayerForRegion(playerName, c.vgRegionList(), callback);
}

function getPlayerForRegion(playerName, regions, callback) {

    if (regions.length > 0) {
        const requestURL = VG_URL + regions[0] + "/players?filter[playerNames]=" + playerName;
        log.debug(requestURL);
    
        const reqOption = getRequestHeader(requestURL);
        if (reqOption == null) {
            return null;
        }
    
        request(reqOption, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                callback(JSON.parse(body));
            } else {
                if (regions.length==1) {
                    callback(null);
                } else {
                    getPlayerForRegion(playerName, regions.slice(1,regions.length-1), callback);
                }

            }
        });
    } else {
        callback(null);
    }
}

/**
 * Method for calculating man of the match
 * @param {Object} details value map with match details 
 * @returns mom score
 * @type Float
 */
const getManOfMatch = (details) => {
    // hero kills
    const sumKills = details.kills * 30;

    // deaths
    const sumDeaths = details.deaths * 30;

    // assist
    const sumAssists = details.assists * 30;

    // kraken captured
    const sumKraken = details.krakenCaptures * 50;

    //turrets destroyed
    const sumTurret = details.turretCaptures * 30;

    // minions killed
    const sumMinion = details.minionKills * 1;

    // captured gold miner
    const sumGoldMiner = details.goldMineCaptures * 40;

    // captured crystal miner
    const sumCrystalMiner = details.crystalMineCaptures * 30;

    return sumKills - sumDeaths + sumAssists + sumKraken + sumTurret + sumMinion + sumGoldMiner + sumCrystalMiner;
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

const updateToken = function(token) {
    requestToken = token;
}

//export
module.exports = {
    getMatch: match,
    getMatchDetails: matchDetails,
    getPlayer: player,
    getMoMScore: getManOfMatch,
    setToken: updateToken
};