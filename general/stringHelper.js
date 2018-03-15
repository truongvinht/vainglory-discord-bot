// stringHelper.js
// helper function for handling strings
// ==================

/**
 * Count spaces within string
 * @private
 * @param {String} input string for counting spaces
 * @returns number of spaces
 * @type Number
 */
const countSpaces = (string) => {
    return (string.match(new RegExp(" ", "g")) || []).length;
}

// export
module.exports = {
    numberOfSpaces: countSpaces
};