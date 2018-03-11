// vgCounterPicker.js
// Handle counter pick for given hero name
// ==================


// import 
const vgCounter = require("../data/heroes.json");
const i18n = require('./langSupport');
var log = require('loglevel');

// weak against
var counter = function(hero) {

    //check for hero name
    if (vgCounter.against.hasOwnProperty(hero)) {

        if (vgCounter.against[hero].length > 0) {
            var list = "";
            for (var name of vgCounter.against[hero]) {
                const fullName = quickHeroLookup(name);
                if (fullName!=null) {
                    list = list + (`- ${fullName}`) + "\n";
                } else {
                    log.error(`- ${name}`)
                    
                    if (name === '?') {
                        list = list + (`- ${name}`) + "\n";
                    }
                }
            }
            return list;
        }
    }

    // hero not found
    return null;
}

// strong against
var support = function(hero) {

    //check for hero name
    if (vgCounter.with.hasOwnProperty(hero)) {

        if (vgCounter.with[hero].length > 0) {
            var list = "";

            for (var name of vgCounter.with[hero]) {
                const fullName = quickHeroLookup(name);
                if (fullName!=null) {
                    list = list + (`+ ${fullName}`) + "\n";
                } else {
                    log.error(`+ ${name}`)
                    
                    if (name === '?') {
                        list = list + (`+ ${name}`) + "\n";
                    }
                }
            }

            return list;
        }
    }
    // hero not found
    return null;
}

// hero list
var heroes = function() {

    // list for output
    var list = "";

    for (var key of Object.keys(vgCounter.hero)) {
        list = list + "+ " + vgCounter.hero[key] + " [" + `${key}` + "]\n";
        
        //Test for all heroes
        // support(quickHeroLookup(key));
        // counter(quickHeroLookup(key));
    }

    let content = {
        "title": `${i18n.get('ListAvailableHeroes')} [${Object.keys(vgCounter.hero).length}]`,
        "content": list
    }

    return content;
}

var quickHeroLookup = function(hero) {
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
