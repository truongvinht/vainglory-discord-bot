// adminMessage.js
// Handling special commands within direct messaging
// ================

//import
const Discord = require("discord.js");
const i18n = require('../general/langSupport');

const serverInfo = (bot,message) => {
    
    let d = new Discord.RichEmbed().setTitle(`${i18n.get('ListConnectedDiscordChannel')}`);
    
    var count = 0;
    
    var contentMap = {};
    
    
    for (var channel of bot.channels.array()) {
        
        
        // only text channel 
        if (channel.type == "text") {
            
            //console.log(channel.guild.name + ": " + channel.name);
            //console.log(channel.members)
            // if (channel.permissionsFor(bot.user).has(Permissions.FLAGS.VIEW_CHANNEL)) {
            //
            //     console.log(channel.permissionsFor(bot.user))
            // }
            
            if (!contentMap.hasOwnProperty(channel.guild.name)) {
                //first entry
                contentMap[channel.guild.name] = `- ${channel.name}`;
            } else {
                contentMap[channel.guild.name] = `${contentMap[channel.guild.name]}\n- ${channel.name}`;
            }
            
        }
    }
    
    for (var key of Object.keys(contentMap)) {
        if (count++ < 24) {
            d = d.addField(key,contentMap[key]);
        }
    }
    
    
    return d;
}

// export
module.exports = {
    getServerInfo: serverInfo
};