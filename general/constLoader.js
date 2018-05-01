// constLoader.js
// handle environment variable
// ==================

//suffix
const SUFFIX_JSON = ".json";

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

// CONFIGURATIONS

// data for all configurations
var dataURL = botSettings.DATA_URL;
if (dataURL == "") {
    dataURL = process.env.DATA_URL;
}

// Game mode
var dataGameMode = botSettings.DATA_FILES.GAME_MODE;
if (dataGameMode == "") {
    dataGameMode = process.env.DATA_FILES_GAME_MODE;
}

// Heroes
var dataHeroes = botSettings.DATA_FILES.HEROES;
if (dataHeroes == "") {
    dataHeroes = process.env.DATA_FILES_HEROES;
}

// Item Description
var dataItemsDesc = botSettings.DATA_FILES.ITEMS_DESCRIPTION;
if (dataItemsDesc == "") {
    dataItemsDesc = process.env.DATA_FILES_ITEMS_DESCRIPTION;
}

// Elo list
var dataEloList = botSettings.DATA_FILES.ELO_LIST;
if (dataEloList == "") {
    dataEloList = process.env.DATA_FILES_ELO_LIST;
}

// API CONFIGURATIONS

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
    
    if (dataURL!=null && dataURL.length > 0) {
        return dataURL + "/" + dataEloList + SUFFIX_JSON;
    }
    
    return dataEloList;
}

const getItemListURL = () => {
    
    if (dataURL!=null && dataURL.length > 0) {
        return dataURL + "/locales/" + language + "/"  + dataItemsDesc + SUFFIX_JSON;
    }
    
    return dataItemsDesc;
}

const getHeroesURL = () => {
    
    if (dataURL!=null && dataURL.length > 0) {
        return dataURL + "/" + dataHeroes + SUFFIX_JSON;
    }
    
    return dataHeroes;
}

const getGameModeURL = () => {
    
    if (dataURL!=null && dataURL.length > 0) {
        return dataURL + "/" + dataGameMode + SUFFIX_JSON;
    }
    
    return dataGameMode;
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
    itemListURL: getItemListURL,
    heroesListURL: getHeroesURL,
    gameModeListURL: getGameModeURL,
    prefix: getPrefix,
    vgServerCode: getVgServerCode,
    restriction: getRestrictedRoles,
    vgToken: getVgToken,
    language: lang,
    author: author,
    version: getVersion
};