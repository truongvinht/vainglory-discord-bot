// constLoader.js
// handle environment variable
// ==================

//suffix
const SUFFIX_JSON = ".json";

//load settings => auto fallback to example for heroku
var botSettings = {};
const exampleSettings = require("../config/example_settings.json");

try {
    botSettings = require("../config/settings.json");
} catch (e) {
    if (e.code !== 'MODULE_NOT_FOUND') {
        throw e;
    }
    console.log('settings.json not found. Loading default example_settings.json...');
    botSettings = exampleSettings;
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

// EXTERNAL Source
var playerURL = botSettings.EXTERNAL.PLAYER;
if (playerURL == "") {
    playerURL = process.env.EXTERNAL_LINK_PLAYER;
}

var heroURL = botSettings.EXTERNAL.HERO;
if (heroURL == "") {
    heroURL = process.env.EXTERNAL_LINK_HERO;
}

var validationCmd = botSettings.validationCmd;
if (validationCmd == "") {
    validationCmd = process.env.validationCmd;
}


// API CONFIGURATIONS

// Vainglory API Token
var vgApiToken = botSettings.VG.TOKEN;
if (vgApiToken == "") {
    // Heroku ENV token
    vgApiToken = process.env.VG_TOKEN;
}
// Clash of Clans API Token
var cocApiToken = botSettings.COC.TOKEN;
if (cocApiToken == "") {
    // Heroku ENV token
    cocApiToken = process.env.COC_TOKEN;
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
// list of regions
const getRegions = () => {
    return botSettings.VG.REGION;
}

// roles for accessing special features
const getRestrictedRoles = () => {
    return botSettings.restricted;
}

const getVgToken = () => {
    return vgApiToken;
}

const getCocToken = () => {
    return cocApiToken;
}

const lang = () => {
    return language;
}

// author information
const author = () => {
    return exampleSettings.author;
};

const getVersion = () => {
    return exampleSettings.version;
};

const getValidationCmd = () => {
    return validationCmd;
};

const getPlayerURL = () => {

    if (playerURL == undefined) {
        return "";
    }

    return playerURL;
};

const getHeroURL = () => {

    if (heroURL == undefined) {
        return "";
    }
    return heroURL;
};

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
    vgRegionList: getRegions,
    restriction: getRestrictedRoles,
    vgToken: getVgToken,
    cocToken: getCocToken,
    language: lang,
    author: author,
    version: getVersion,
    playerLink: getPlayerURL,
    validationCmd: getValidationCmd,
    heroLink: getHeroURL
};