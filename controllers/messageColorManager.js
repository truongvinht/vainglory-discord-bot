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
    ELO_LIST: 11
};

const colorMap = {
    "1": "#FFFFFF", // HELP
    "2": "FF0000", // COUNTER
    "3": "#008000", // SUPPORT
    "4": "#123456", // COUNTER_SUPPORT
    "5": "#CD7F32", // PLAYER_DETAILS_B
    "6": "#C0C0C0", // PLAYER_DETAILS_S
    "7": "#FFD700", // PLAYER_DETAILS_G
    "8": "#531b93", // RECENT_PLAYED
    "9": "#424242", // MATCH
    "10": "#222222", // MATCH_DETAILS
    "11": "#234234" // ELO_LIST
    
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

// export
module.exports = {
    getColor: colorForMessage,
    getType: messageType,
    isPlayerDetails:isPlayerDetails
};