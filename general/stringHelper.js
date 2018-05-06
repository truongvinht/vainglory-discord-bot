// stringHelper.js
// helper function for handling strings
// ==================

/**
 * Count spaces within string
 * @param {String} input string for counting spaces
 * @returns number of spaces
 * @type Number
 */
const countSpaces = (string) => {
    return (string.match(new RegExp(" ", "g")) || []).length;
}

/**
 * Check whether string is a command
 * @param {String} inputString with component for checking command
 * @param {String} command command for checking
 * @returns true if the command is matching
 * @type Boolean
 */
const containsCommand = (inputString, command) => {
    return inputString.toLowerCase() === command;
}


/**
 * Check whether string is matching to one of given command
 * @param {String} inputString with component for checking command
 * @param {String} commands command for checking
 * @returns true if a command is matching
 * @type Boolean
 */
const containsCommands = (inputString, commands) => {
    
    if (commands.length == 1) {
        return containsCommand(inputString, commands[0]);
    }
    
    for (var c of commands) {
        if (inputString.toLowerCase() === c) {
            return true;
        }
    }
    
    return false;
}

/**
 * Split string and collect into an array which is wrapped by given separator string
 * @param {String} inputString with component for splitting
 * @param {String} separator string
 * @returns array with matching items (strings)
 * @type Object
 */
const collectWrappedString = (inputString, separator) => {
    
    //invalid split
    if (separator==undefined || separator == null) {
        return [];
    }
    
    // array for collecting results
    var resultList = [];
    const tmpList = inputString.split(separator);
    
    for (var index = 0; index< tmpList.length; index++) {
        if (index%2==1 && index+1 < tmpList.length) {
            resultList.push(tmpList[index]);
        }
    }
    
    return resultList;
}

// export
module.exports = {
    numberOfSpaces: countSpaces,
    hasCmd: containsCommand,
    hasCmds: containsCommands,
    collectWrappedString: collectWrappedString
};