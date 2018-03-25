// adminMessage.js
// Handling special commands within direct messaging
// ================

//import
const Discord = require("discord.js");
const i18n = require('../general/langSupport');

const serverInfo = (bot,message) => {
    
    //console.log(message.channel.guild);
    
    let d = new Discord.RichEmbed().setTitle(`${i18n.get('ListConnectedDiscordChannel')}`);
    for (var channel of bot.channels.array()) {
        // only text channel 
        if (channel.type == "text") {
            d = d.addField(channel.guild.name,channel.name);
        }
    }
    
    return d;
}

// export
module.exports = {
    getServerInfo: serverInfo
};