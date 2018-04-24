// vainglory-base.js
// Helper function for getting details
// ================

const modeUtility = require(`../data/gameMode.json`);
const i18n = require('../general/langSupport');

const gameMode = function(mode) {
    if (modeUtility.mode.hasOwnProperty(mode)) {
      return modeUtility.mode[mode];
    } else {
      return mode;
    }
}

const karma = function(mode) {
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
const tier = function(skillTier) {
    
    //unranked
    if (skillTier < 0) {
        return "T0"
    }
    
    var rank = `T${Math.floor(skillTier/3)+1}`;
    
    switch(skillTier%3) {
        case 0:
            rank =`${rank} ${i18n.get('Bronze')}`;
            break;
        case 1:
            rank =`${rank} ${i18n.get('Silver')}`;
            break;
        case 2:
            rank =`${rank} ${i18n.get('Gold')}`;
    }
    
    return rank;
}

const convertTier = function(skillTier) {
    return skillTier.replace(` ${i18n.get('Bronze')}`,"a")
        .replace(` ${i18n.get('Silver')}`,"b")
        .replace(` ${i18n.get('Gold')}`,"c")
        .replace("T0","unranked")
        .replace("?","unranked")
        .replace("T10","tier_10")
        .replace("T","tier_0");
}


const tierFromNum = function(skillTier) {
    
    const convertedValue = tier(skillTier);
    return convertTier(convertedValue);
}

// export
module.exports = {
    getMode: gameMode,
    getKarma: karma,
    getTier: tier,
    convertTier: convertTier,
    getTierFromNum: tierFromNum
};