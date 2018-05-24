// vgCounterPicker.js
// Handle counter pick for given hero name
// ==================

// import 
const request = require('request');

const i18n = require('../general/langSupport');
var log = require('loglevel');

var HeroDetailsManager = (function () {
    var instance;
    
    function initInstance() {
        
        //url for request
        var data = "";
        var reqOption = {};

        return {
            initURL: function(url) {
                
                reqOption = {
                    url: url,
                    headers: {
                        'User-Agent': 'request',
                        'Accept': 'application/json'
                    }
                };

                request(reqOption, function(error, response, body) {

                    if (!error && response.statusCode == 200) {
                        var json = JSON.parse(body);
                        data = json;
                        log.debug("Heroes loaded...");
                    } else {
                        log.error("error while loading heroes json [" +url + "]");
                    }
                });
                return;
            },
            reloadContent: function() {
                request(reqOption, function(error, response, body) {

                    if (!error && response.statusCode == 200) {
                        var json = JSON.parse(body);
                        data = json;
                        log.debug("Heroes reloaded...");
                    } else {
                        log.error("error while reloading heroes json [" +url + "]");
                    }
                });
                return;
            },
            content: function() {
                return data;
            }
        }
    }
    return {
        getInstance: function() {
            if (!instance) {
                instance = initInstance();
            }
            return instance;
        } 
    };
})();


/**
 * Get Heroes from remote server
 * @private
 * @returns JSON data object with heroes details
 */
function getHeroesData() {
    return HeroDetailsManager.getInstance().content();
}

/**
 * Get Heroes which counter entered hero name (weak against)
 * @private
 * @param {String} hero name for finding counter
 * @returns List of heroes which counters entered hero
 * @type Array
 */
const counter = (hero) => {
    return heroPick(getHeroesData().against, hero, "-");
}

/**
 * Get Heroes entered hero would have advantage against (Strong against)
 * @private
 * @param {String} hero name for finding list of heroes which are strong against
 * @returns List of heroes which are weak against entered hero
 * @type Array
 */
const support = (hero) => {
    return heroPick(getHeroesData().with, hero, "+");
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

    var heroesList = [];

    for (var key of Object.keys(getHeroesData().hero)) {

        const abilities = getHeroesData().ability;
        
        if (abilities.hasOwnProperty(`${getHeroesData().hero[key].toLowerCase()}`)) {
            const ability = abilities[getHeroesData().hero[key].toLowerCase()];
            heroesList.push({'name':getHeroesData().hero[key],'key':key, 'type': ability.type, 'ability':ability});
        } else {
            heroesList.push({'name':getHeroesData().hero[key],'key':key});
        }
    }


    // list for output
    // var list = "";

    // for (var key of Object.keys(getHeroesData().hero)) {
    //     list = `${list}+ ${getHeroesData().hero[key]} [${key}]\n`;
    // }

    return {
        "title": `${i18n.get('ListAvailableHeroes')} [${Object.keys(getHeroesData().hero).length}]`,
        "content": heroesList
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
        if (getHeroesData().hero.hasOwnProperty(hero)) {
            return getHeroesData().hero[hero];
        }
    } else {
        return null;
    }
}

// initialize url for points json
const prepUrl = function(url) {
    HeroDetailsManager.getInstance().initURL(url);
}

const reloadUrl = () => {
    HeroDetailsManager.getInstance().reloadContent();
}

// export
module.exports = {
    getCounter: counter,
    getSupport: support,
    getHeroes: heroes,
    getHeroName: quickHeroLookup,
    initURL: prepUrl,
    reload: reloadUrl
};