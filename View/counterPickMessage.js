// counterPickMessage.js
// Hero Counterpicker messages
// ================

//import
const Discord = require("discord.js");
const i18n = require('../general/langSupport');
const c = require("../general/constLoader");
const colorMng = require('../controllers/messageColorManager');

//counter picker
const cp = require('../controllers/vgCounterPicker');

const heroList = () => {
    var d = new Discord.RichEmbed();
    let keyValueMap = cp.getHeroes();

    var content = "";

    //symbole as prefix for every row
    const symbole = "◦";

    for (let item of keyValueMap.content) {
        console.log(item);

        if (content.length == 0) {
            if (item.hasOwnProperty('type')) {
                content = symbole +" " + formatHeroString(item.name + " [" + item.key + "]", item.type);
            } else {
                content = symbole +" " + item.name + " [" + item.key + "]";
            }

        } else {
            if (item.hasOwnProperty('type')) {
                content = content + "\n" + symbole +" " + formatHeroString(item.name + " [" + item.key + "]", item.type);
            } else {
                content = content + "\n" + symbole +" " + item.name + " [" + item.key + "]";
            }
            
        }
    }

    //prevent broken message
    if (content.length == 0) {
        content = "-";
    } else {
        d.setDescription("**Captain** | __Laner__ | Jungler");
    }

    return d.addField(keyValueMap.title, content);
}

/**
 * Helper method to convert string into formated string for message
 * @param {String} input input string for formatting
 * @param {String} type captain,jungler, laner as input type
 * @return formated string
 */
function formatHeroString(input, type) {
    if (type != undefined) {
        if (type == 'captain') {
            return  "**" + input + "**";
        } else if (type == 'laner') {
            return  "__" + input + "__";
        }
    }
    return input
}

const counterPickHero = (hero) => {
    var d = new Discord.RichEmbed().setColor(colorMng.getColor(2));
    let result = cp.getCounter(hero.toLowerCase());
    if (result != null) {
        d = d.setThumbnail(`${c.imageURL()}/${hero.toLowerCase()}.png`)
            .addField(`${hero} ${i18n.get('IsWeakAgainst')}`, result);
    } else {
        d = d.setDescription(`'${hero}' ${i18n.get('NotFound')}`);
    }
    return d;
}

const quickCounterPickHero = (heroCode) => {
    
    if (heroCode.length > 2) {
        return counterPickHero(heroCode);
    }
    
    //hero quick name
    let hName = heroCode.toLowerCase();
    let heroName = cp.getHeroName(hName);
    
    if (heroName != null) {
        return counterPickHero(heroName);
    } else {
        return new Discord.RichEmbed().setColor(colorMng.getColor(2))
        .setDescription(`'${hName}': ${i18n.get('InvalidHeroCode')}`);
    }
}

const supportPickHero = (hero) => {
    var d = new Discord.RichEmbed().setColor(colorMng.getColor(3));
    let result = cp.getSupport(hero.toLowerCase());
    if (result != null) {
        console.log(`${c.imageURL()}/${hero.toLowerCase()}.png`);
        d = d.setThumbnail(`${c.imageURL()}/${hero.toLowerCase()}.png`)
            .addField(`${hero} ${i18n.get('IsStrongAgainst')}`, result);
    } else {
        d = d.setDescription(`'${hero}' ${i18n.get('NotFound')}`);
    }
    return d;
}

const quickSupportPickHero = (heroCode) => {
    
    if (heroCode.length > 2) {
        return supportPickHero(heroCode);
    }
    
    //hero quick name
    let hName = heroCode.toLowerCase();
    let heroName = cp.getHeroName(hName);
    
    if (heroName != null) {
        return supportPickHero(heroName);
    } else {
        return new Discord.RichEmbed().setColor(colorMng.getColor(3))
        .setDescription(`'${hName}': ${i18n.get('InvalidHeroCode')}`);
    }
}

const generalInfo = (heroName) => {

    if (heroName != null) {
        let result = cp.getCounter(heroName.toLowerCase());
        let resultSupport = cp.getSupport(heroName.toLowerCase());

        if (result != null) {
            return result;
        } else {
            return null;
        }
    } else {
        return null;
    }
}

// export
module.exports = {
    getHeroes: heroList,
    getCounter: counterPickHero,
    getQuickCounter: quickCounterPickHero,
    getSupport: supportPickHero,
    getQuickSupport:quickSupportPickHero,
    getGeneral: generalInfo
};