// cocHandler.js
// Handle request to clash of clans api
// ==================

//dependency
var request = require('request');
var fs = require('fs');
var log = require('loglevel');

const c = require("../general/constLoader");

// request token for COC API
var requestToken = '';

// URL for Vainglory developer API
const COC_URL = 'https://api.clashofclans.com/v1/'

// clan
const clan = (rawTag, callback) => {
    const tag = convertHashTag(rawTag);

    const requestURL = COC_URL + "clans/" + tag;
    log.debug(requestURL);

    const reqOption = getRequestHeader(requestURL);
    if (reqOption == null) {
        return null;
    }

    request(reqOption, function(error, response, body) {

        if (callback != null) {
            if (!error && response.statusCode == 200) {
                callback(JSON.parse(body));
            } else {
                // error
                callback(null);
            }
        }
    });
}

// convert hash tag to symbol for request
function convertHashTag(tag) {
    return tag.replace("#", "%23");
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
            'Authorization': 'Bearer '+key,
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
    getClan: clan,
    setToken: updateToken
};