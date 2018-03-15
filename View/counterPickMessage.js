// counterPickMessage.js
// Hero Counterpicker messages
// ================

//import
const Discord = require("discord.js");
const i18n = require('../general/langSupport');
const c = require("../general/constLoader");

//counter picker
const cp = require('../controllers/vgCounterPicker');

const heroList = () => {
    var d = new Discord.RichEmbed();
    let keyValueMap = cp.getHeroes();
    return d.addField(keyValueMap.title, keyValueMap.content);
}

const counterPickHero = (hero) => {
    var d = new Discord.RichEmbed().setColor("#ff0000");
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
    
    //hero quick name
    let hName = heroCode.toLowerCase();
    let heroName = cp.getHeroName(hName);
    
    if (heroName != null) {
        return counterPickHero(heroName);
    } else {
        return new Discord.RichEmbed().setColor("#ff0000")
        .setDescription(`'${hName}': ${i18n.get('InvalidHeroCode')}`);
    }
}

const supportPickHero = (hero) => {
    var d = new Discord.RichEmbed().setColor("#008000");
    let result = cp.getSupport(hero.toLowerCase());
    if (result != null) {
        d = d.setThumbnail(`${c.imageURL()}/${hero.toLowerCase()}.png`)
            .addField(`${hero} ${i18n.get('IsStrongAgainst')}`, result);
    } else {
        d = d.setDescription(`'${hero}' ${i18n.get('NotFound')}`);
    }
    return d;
}

const quickSupportPickHero = (heroCode) => {
    
    //hero quick name
    let hName = heroCode.toLowerCase();
    let heroName = cp.getHeroName(hName);
    
    if (heroName != null) {
        return supportPickHero(heroName);
    } else {
        return new Discord.RichEmbed().setColor("#008000")
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