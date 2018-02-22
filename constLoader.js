// constLoader.js
// handle environment variable
// ==================

const botSettings = require("./botsettings.json");

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

// github image url for Tier
var tierImageURL = botSettings.TIER_IMAGE_URL;
if (tierImageURL == "") {
    // Heroku ENV token
    tierImageURL = process.env.TIER_IMAGE_URL;
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

const getBotToken = () => {
    return botToken;
}

const getImageURL = () => {
    return imageURL;
}

const getTierImageURL = () => {
    return tierImageURL;
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

// export
module.exports = {
    botToken: getBotToken,
    imageURL: getImageURL,
    tierImageURL: getTierImageURL,
    eloListURL: getEloListURL,
    prefix: getPrefix,
    vgServerCode: getVgServerCode,
    restriction: getRestrictedRoles,
    vgToken: getVgToken
};