// vgCounterPicker.js
// Handle counter pick for given hero name
// ==================

// import 
const vgCounter = require("../data/heroes.json");
const i18n = require('../general/langSupport');
var log = require('loglevel');

/**
 * Get Heroes which counter entered hero name (weak against)
 * @private
 * @param {String} hero name for finding counter
 * @returns List of heroes which counters entered hero
 * @type Array
 */
const counter = (hero) => {
    return heroPick(vgCounter.against, hero, "-");
}

/**
 * Get Heroes entered hero would have advantage against (Strong against)
 * @private
 * @param {String} hero name for finding list of heroes which are strong against
 * @returns List of heroes which are weak against entered hero
 * @type Array
 */
const support = (hero) => {
    return heroPick(vgCounter.with, hero, "+");
}

function heroPick(map, hero, prefix) {

    //check for hero name
    if (map.hasOwnProperty(hero)) {

        if (map[hero].length > 0) {
            var list = "";

            for (var name of map[hero]) {
                const fullName = quickHeroLookup(name);
                if (fullName!=null) {
                    list = list + (`${prefix} ${fullName}`) + "\n";
                } else {
                    // hero could not be found
                    log.error(`+ ${name}`)
                    
                    //display the code instead of the hero name
                    if (name === '?') {
                        list = list + (`${prefix} ${name}`) + "\n";
                    }
                }
            }
            return list;
        }
    }
    
    // hero not found
    return null;
}

/**
 * Get list of available heroes with their matching hero code
 * @returns List of available heroes
 * @type Array
 */
const heroes = () => {

    // list for output
    var list = "";

    for (var key of Object.keys(vgCounter.hero)) {
        list = `${list}+ ${vgCounter.hero[key]} [${key}]\n`;
    }

    return {
        "title": `${i18n.get('ListAvailableHeroes')} [${Object.keys(vgCounter.hero).length}]`,
        "content": list
    }
}

/**
 * Method to get the matching hero name based on the hero code
 * @param {String} hero entered  hero code
 * @returns full hero name or null if code could not be encoded
 * @type String
 */
const quickHeroLookup = (hero) => {
    if (hero.length == 2) {
        if (vgCounter.hero.hasOwnProperty(hero)) {
            return vgCounter.hero[hero];
        }
    } else {
        return null;
    }
}

// export
module.exports = {
    getCounter: counter,
    getSupport: support,
    getHeroes: heroes,
    getHeroName: quickHeroLookup
};