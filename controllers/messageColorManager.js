// messageColorManager.js
// handling message colors
// ==================

const MessageTypes = {
    UNKNOWN:0,
    HELP:1, 
    COUNTER:2, 
    SUPPORT:3,
    COUNTER_SUPPORT:4,
    PLAYER_DETAILS_B: 5,
    PLAYER_DETAILS_S: 6,
    PLAYER_DETAILS_G: 7,
    RECENT_PLAYED: 8,
    MATCH: 9,
    MATCH_DETAILS: 10,
    ELO_LIST: 11,
    MATCH_PLAYER_DETAILS: 12,
    VGPRO_PLAYER_DATA:13,
    RECENT_MATCH_TYPE: 14,
    RANDOMIZER: 15,
    RANDOMIZER_LANER: 16,
    RANDOMIZER_JUNGLER: 17,
    RANDOMIZER_CAPTAIN: 18
};

const colorMap = {
    "1": "#FFFFFF", // HELP
    "2": "FF0000", // COUNTER
    "3": "#008000", // SUPPORT
    "4": "#123456", // COUNTER_SUPPORT
    "5": "#CD7F32", // PLAYER_DETAILS_B
    "6": "#C0C0C0", // PLAYER_DETAILS_S
    "7": "#FFD700", // PLAYER_DETAILS_G
    "8": "#531B93", // RECENT_PLAYED
    "9": "#424242", // MATCH
    "10": "#222222", // MATCH_DETAILS
    "11": "#234234", // ELO_LIST
    "12": "#123123", // MATCH_PLAYER_DETAILS
    "13": "#FFFF00", // VGPRO PLAYER DATA
    "14": "531B90", // RECENT MATCH TYPES
    "15": "#942192", // RANDOMIZER
    "16": "#942193", // RANDOMIZER Laner
    "17": "#942194", // RANDOMIZER Jungler
    "18": "#942195" // RANDOMIZER Captain
    
};

/**
 * Get HEX color for message type
 * @param {Strubg} type messageType
 * @returns Describe what it returns
 * @type String|Object|Array|Boolean|Number
 */
const colorForMessage = (type) => {
    return colorMap[`${type}`];
}

const messageType = (color) => {
    
    for (let key of Object.keys(colorMap)) {
        if (color.toUpperCase() == colorMap[key]) {
            return key;
        }
    }
    
    return MessageTypes.UNKNOWN;
}

const isPlayerDetails = (color) => {
    
    let colorIndex = parseInt(messageType(color.toUpperCase()));
    
    if (colorIndex >= MessageTypes.PLAYER_DETAILS_B && 
        colorIndex <= MessageTypes.PLAYER_DETAILS_G ) {
        return true;  
    } else {
        return false;
    }
}

const isRecentStats = (color) => {
    
    let colorIndex = parseInt(messageType(color.toUpperCase()));
    
    if (colorIndex == MessageTypes.RECENT_PLAYED) {
        return true;  
    } else {
        return false;
    }
}

const isMatch = (color) => {
    
    let colorIndex = parseInt(messageType(color.toUpperCase()));
    
    if (colorIndex == MessageTypes.MATCH) {
        return true;  
    } else {
        return false;
    }
}

const isDamageStats = (color) => {
    
    let colorIndex = parseInt(messageType(color.toUpperCase()));
    
    if (colorIndex == MessageTypes.MATCH_PLAYER_DETAILS) {
        return true;  
    } else {
        return false;
    }
}

const isCounterPick = (color) => {

    let colorIndex = parseInt(messageType(color.toUpperCase()));
    
    if (colorIndex == MessageTypes.COUNTER_SUPPORT ||
        colorIndex == MessageTypes.COUNTER ||
        colorIndex == MessageTypes.SUPPORT) {
        return true;  
    } else {
        return false;
    }
}

const isRandomizer = (color) => {
    let colorIndex = parseInt(messageType(color.toUpperCase()));
    return colorIndex == MessageTypes.RANDOMIZER
}
const randomizerIndex = (color) => {
    let colorIndex = parseInt(messageType(color.toUpperCase()));
    if(colorIndex == MessageTypes.RANDOMIZER_LANER) {
        return 1;
    }  
    
    if(colorIndex == MessageTypes.RANDOMIZER_JUNGLER) {
        return 2;
    }  
    
    if(colorIndex == MessageTypes.RANDOMIZER_CAPTAIN) {
        return 3;
    } 
    return 0;
}

const greenString = (text) => {
    return "```CSS\n"+text+"\n```";
}

// export
module.exports = {
    getColor: colorForMessage,
    getType: messageType,
    isPlayerDetails:isPlayerDetails,
    isRecentStats: isRecentStats,
    isDamageStats: isDamageStats,
    isMatch: isMatch,
    isCounterPick:isCounterPick,
    isRandomizer:isRandomizer,
    randomizerIndex:randomizerIndex,
    getGreenString: greenString
};
