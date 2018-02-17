// vainglory-base.js
// Helper function for getting details
// ================

const modeUtility = require(`./data/gameMode.json`);
const i18n = require('./langSupport');

var gameMode = function(mode) {
    if (modeUtility.hasOwnProperty(mode)) {
      return modeUtility[mode];
    } else {
      return mode;
    }
}

var karma = function(mode) {
    switch(mode) {
    case 0:
        return `${i18n.get('KarmaBad')}`;
    case 1:
        return `${i18n.get('KarmaGood')}`;
    case 2:
        return `${i18n.get('KarmaGreat')}`;
    default:
        return "?"
    }
}

// tier list
var tier = function(skillTier) {
    switch(skillTier) {
    case -1:
        return "T0";
    case 0:
        return "T1 Bronze";
    case 1:
        return "T1 Silver";
    case 2:
        return "T1 Gold";
    case 3:
        return "T2 Bronze";
    case 4:
        return "T2 Silver";
    case 5:
        return "T2 Gold";
    case 6:
        return "T3 Bronze";
    case 7:
        return "T3 Silver";
    case 8:
        return "T3 Gold";
    case 9:
        return "T4 Bronze";
    case 10:
        return "T4 Silver";
    case 11:
        return "T4 Gold";
    case 12:
        return "T5 Bronze";
    case 13:
        return "T5 Silver";
    case 14:
        return "T5 Gold";
    case 15:
        return "T6 Bronze";
    case 16:
        return "T6 Silver";
    case 17:
        return "T6 Gold";
    case 18:
        return "T7 Bronze";
    case 19:
        return "T7 Silver";
    case 20:
        return "T7 Gold";
    case 21:
        return "T8 Bronze";
    case 22:
        return "T8 Silver";
    case 23:
        return "T8 Gold";
    case 24:
        return "T9 Bronze";
    case 25:
        return "T9 Silver";
    case 26:
        return "T9 Gold";
    case 27:
        return "T10 Bronze";
    case 28:
        return "T10 Silver";
    case 29:
        return "T10 Gold";
    default:
        return "?";
    }
}

// export
module.exports = {
    getMode: gameMode,
    getKarma: karma,
    getTier: tier
};