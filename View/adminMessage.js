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

const botDetails = (bot) => {
    let d = new Discord.RichEmbed().setTitle(`${i18n.get('OverviewGuildDistribution')}`);
    
    var contentMap = {};
    
    for (var g of bot.guilds.array()) {
        
         let channelCount = g.channels.array().length;
         let memberCount = g.members.array().length;
        
        if (contentMap.hasOwnProperty(`${g.region}`)) {

            contentMap[g.region] = {
                'region':g.region,
                'guilds': contentMap[g.region].guilds + 1,
                'channels': contentMap[g.region].channels + channelCount,
                'members':contentMap[g.region].members  + memberCount
            };
        } else {
            contentMap[g.region] = {
                'region':g.region,
                'guilds': 1,
                'channels': channelCount,
                'members':memberCount
            };
        }
    }
    
    for (let k of Object.keys(contentMap)) {
        d = d.addField(`${k}`,`${contentMap[k].guilds} ${i18n.get('Guilds')}, ${contentMap[k].members} ${i18n.get('Users')}`)
    }
    
    return d;
}

// export
module.exports = {
    getServerInfo: serverInfo,
    getBotDetails: botDetails
};