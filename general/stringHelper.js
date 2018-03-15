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
 * Count spaces within string
 * @param {String} inputString with component for checking command
 * @returns true if the command is matching
 * @type Boolean
 */
const containsCommand = (inputString, command) => {
    return inputString.toLowerCase() === command;
}

// export
module.exports = {
    numberOfSpaces: countSpaces,
    hasCmd: containsCommand
};