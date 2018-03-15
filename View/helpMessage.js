// helpMessage.js
// Help messages
// ================

//import
const Discord = require("discord.js");
const i18n = require('../general/langSupport');

/**
 * Sending general informations about available commands within channel
 * @param {PREFIX} prefix for each command for bot control
 * @param {author} name of the user who triggers the bot
 * @param {hasRole} flag whether user has special permission
 * @returns message block with all informations about available commands
 * @type RichEmbed
 */
const helpMessage = (PREFIX, author, hasRole) => {
    let embed = new Discord.RichEmbed()
        .setAuthor(`${author}`)
        .setDescription(`${i18n.get('FollowingCommands')}`)
        .addField(`${PREFIX}about`, `${i18n.get('AboutBot')}`)
        .addField(`${PREFIX}counter HERO`, `${i18n.get('DisplayWeaknessHero')}`)
        .addField(`${PREFIX}support HERO`, `${i18n.get('DisplayStrengthHero')}`)
        .addField(`${PREFIX}HERO-CODE`, `${i18n.get('DisplayInfoHeroCode')}`)
        .addField(`${PREFIX}hero`, `${i18n.get('DisplayListHero')}`)
        .addField(`${PREFIX}player ${i18n.get('Player')} [server]`,
             `${i18n.get('HelpPlayerDetails')}`)
        .addField(`${PREFIX}recent ${i18n.get('Player')} [server]`, `${i18n.get('RecentHeroes')}`)
        .addField(`${PREFIX}elo ELO`, `${i18n.get('EloDetails')}`)
        .addField(`${PREFIX}match ${i18n.get('Player')} [server]`,
             `${i18n.get('LastMatchDetails')}`);

    if (hasRole) {
        embed.addField(`${PREFIX}info ${i18n.get('Player')}`,
             `${i18n.get('HelpPlayerDetailsFull')}`);
        embed.addField(`${PREFIX}item`, `${i18n.get('ItemDescription')}`);
        embed.addField(`${PREFIX}afk ${i18n.get('Player')} [server]`, `${i18n.get('AfkInfo')}`);
        embed.addField(`${PREFIX}clear`, `${i18n.get('ClearCmd')}`);
    }
    return embed;
}

/**
 * Sending general informations about available commands for direct messaging
 * @param {PREFIX} prefix for each command for bot control
 * @param {author} name of the user who triggers the bot
 * @returns message block with all informations about available commands
 * @type RichEmbed
 */
const directHelpMessage = (PREFIX, author) => {
    let embed = new Discord.RichEmbed()
    .setAuthor(`${author}`)
    .setDescription(`${i18n.get('FollowingCommands')}`)
    .addField(`${PREFIX}msg CHANNEL MESSAGE`, `${i18n.get('HelpSendMessage')}`);
    return embed;
}

// export
module.exports = {
    getChannelHelp: helpMessage,
    getDmHelp: directHelpMessage
};