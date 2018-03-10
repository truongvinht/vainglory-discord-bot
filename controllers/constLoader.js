// constLoader.js
// handle environment variable
// ==================

//load settings => auto fallback to example for heroku
var botSettings = {};
try {
    botSettings = require("../config/settings.json");
} catch (e) {
    if (e.code !== 'MODULE_NOT_FOUND') {
        throw e;
    }
    console.log('settings.json not found. Loading default example_settings.json...');
    botSettings = require("../config/example_settings.json");
}

//Bot Token
var botToken = botSettings.token;
if (botToken == "") {
    // Heroku ENV token
    botToken = process.env.BOT_TOKEN;
}

//Image source
var imageURL = botSettings.imageURL;
if (imageURL == "") {
    // Heroku ENV token
    imageURL = process.env.IMAGE_URL;
}

// link to elo point list
var eloListURL = botSettings.ELO_LIST_URL;
if (eloListURL == "") {
    // Heroku ENV token
    eloListURL = process.env.ELO_LIST_URL;
}

// Vainglory API Token
var vgApiToken = botSettings.vgAPIToken;
if (vgApiToken == "") {
    // Heroku ENV token
    vgApiToken = process.env.vgAPIToken;
}

// default language
var language = botSettings.lang;
if (language == "") {
    if (process.env.LANG != null && process.env.LANG != "") {
        // Heroku ENV token
        language = process.env.LANG;
    } else {
        //default language EN
        language = 'en';
    }
}

// author information
var creator = botSettings.author;
if (creator == "") {
    // Heroku ENV token
    creator = process.env.AUTHOR;
}

const getBotToken = () => {
    return botToken;
}

const getImageURL = () => {
    return imageURL + "/heroes";
}

const getTierImageURL = () => {
    return imageURL + "/skill_tiers";
}


const getItemURL = () => {
    return imageURL + "/items";
}

const getEloListURL = () => {
    return eloListURL;
}

//load prefix
const getPrefix = () => {
    return botSettings.prefix;
}

//default vg server code
const getVgServerCode = (code) => {
    
    //check for valid code 2 or 3 characters
    if (code !=null && code.length > 1 && code.length < 4) {
        return code;
    } else {
        //code empty or invalid
        return botSettings.vaingloryAPIServer;
    }
}

// roles for accessing special features
const getRestrictedRoles = () => {
    return botSettings.restricted;
}

const getVgToken = () => {
    return vgApiToken;
}

const lang = () => {
    return language;
}

const author = () => {
    return creator
}

const getVersion = () => {
    return botSettings.version;
} 

// export
module.exports = {
    botToken: getBotToken,
    imageURL: getImageURL,
    tierImageURL: getTierImageURL,
    itemURL: getItemURL,
    eloListURL: getEloListURL,
    prefix: getPrefix,
    vgServerCode: getVgServerCode,
    restriction: getRestrictedRoles,
    vgToken: getVgToken,
    language: lang,
    author: author,
    version: getVersion
};