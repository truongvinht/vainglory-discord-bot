// eloMessage.js
// elo point messages
// ================

//import
const Discord = require("discord.js");
const i18n = require('../general/langSupport');
const colorMng = require('../controllers/messageColorManager');

//elo calculator
const eloCalc = require('../controllers/eloCalculator');

const eloList = () => {
    
    //list of embed messages
    var list = [];
    
    var d = new Discord.RichEmbed().setColor(colorMng.getColor(11));
    
    const MAX_SPLIT = 20;
    
    for (var i=0;i<MAX_SPLIT;i++) {
         const info = eloCalc.getScore(i);
         d = d.addField(`${info.title}`, `${info.starts} - ${info.ends}`);
    }
    
    list.push(d);

    d = new Discord.RichEmbed().setColor(colorMng.getColor(11));
    for (var i=MAX_SPLIT;i<30;i++) {
         const info = eloCalc.getScore(i);
         d = d.addField(`${info.title}`, `${info.starts} - ${info.ends}`);
    }
    list.push(d);
    return list;
}


// export
module.exports = {
    getList: eloList
};