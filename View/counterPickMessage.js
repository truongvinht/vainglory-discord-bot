// counterPickMessage.js
// Hero Counterpicker messages
// ================

//import
const Discord = require("discord.js");
const i18n = require('../general/langSupport');
const c = require("../general/constLoader");

//counter picker
const cp = require('../controllers/vgCounterPicker');

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

// export
module.exports = {
    getCounter: counterPickHero,
};