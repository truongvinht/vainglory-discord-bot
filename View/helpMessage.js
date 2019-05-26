// helpMessage.js
// Help messages
// ================

//import
const Discord = require("discord.js");
const i18n = require('../general/langSupport');
const constant = require("../general/constLoader");
const colorMng = require('../controllers/messageColorManager');

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
        .setColor(`${colorMng.getColor(1)}`)
        .setAuthor(`${author}`)
        .setDescription(`${i18n.get('FollowingCommands')}`)
        .addField(`${PREFIX}counter HERO`, `${i18n.get('DisplayWeaknessHero')}`)
        .addField(`${PREFIX}support HERO`, `${i18n.get('DisplayStrengthHero')}`)
        .addField(`${PREFIX}HERO-CODE`, `${i18n.get('DisplayInfoHeroCode')}`)
        .addField(`${PREFIX}hero`, `${i18n.get('DisplayListHero')}`)
        // .addField(`${PREFIX}player ${i18n.get('Player')}`,`${i18n.get('HelpPlayerDetails')}`)
        // .addField(`${PREFIX}recent ${i18n.get('Player')}`, `${i18n.get('RecentHeroes')}`)
        // .addField(`${PREFIX}match ${i18n.get('Player')}`,`${i18n.get('LastMatchDetails')}`)
        .addField(`${PREFIX}elo ELO | ${PREFIX}elo ${i18n.get('Player')}`, `${i18n.get('EloDetails')}`)
        .addField(`${PREFIX}random NAME`, `${i18n.get('RandomizerInfo')}`);
        //.addField(`${PREFIX}vgitem CODE`, `${i18n.get('ItemDescription')}`);

    if (hasRole) {
        embed
            //.addField(`${PREFIX}update VERSION`, `${i18n.get('HelpUpdatedItems')}`)
            .addField(`${PREFIX}clear`, `${i18n.get('ClearCmd')}`);
    }
    embed.setFooter(`${i18n.get('Version')}: ${constant.version()} - ${constant.author()}`);

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
    .setColor(`${colorMng.getColor(1)}`)
    .setAuthor(`${author}`)
    .setDescription(`${i18n.get('FollowingCommands')}`)
    .addField(`${PREFIX}afk ${i18n.get('Player')}`, `${i18n.get('AfkInfo')}`)
    .addField(`${PREFIX}find UUID`, `${i18n.get('HelpPlayerDetails')} [UUID]`)
    .addField(`${PREFIX}match ${i18n.get('Player')}`,`${i18n.get('LastMatchDetails')}`)
    .addField(`${PREFIX}msg CHANNEL MESSAGE`, `${i18n.get('HelpSendMessage')}`)
    .addField(`${PREFIX}cmd CHANNEL ${PREFIX}player ${i18n.get('Player')}`, `${i18n.get('HelpPlayerDetails')}`)
    .addField(`${PREFIX}cmd CHANNEL ${PREFIX}help`, `${i18n.get('HelpInfos')}`)
    .addField(`${PREFIX}cmd CHANNEL ${PREFIX}HERO-CODE`, `${i18n.get('DisplayInfoHeroCode')}`);
    return embed;
}

/**
 * Sending general informations about coc commands
 * @param {PREFIX} prefix for each command for bot control
 * @param {author} name of the user who triggers the bot
 * @returns message block with all informations about available commands
 * @type RichEmbed
 */
const cocHelpMessage = (PREFIX, author) => {
    let embed = new Discord.RichEmbed()
    .setColor(`${colorMng.getColor(1)}`)
    .setAuthor(`${author}`)
    .setDescription(`${i18n.get('FollowingCommands')}`)
    .addField(`${PREFIX}clan CODE`, `Details zum Clan`)
    .addField(`${PREFIX}clans NAME / ${PREFIX}clansuche NAME`, `Suche nach clan (Name)`)
    .addField(`${PREFIX}cwl CODE`, `Suche nach letztem Clan War League`)
    .addField(`${PREFIX}clasher CODE / ${PREFIX}mitglied CODE / ${PREFIX}claner CODE`, `Details zum Spieler`);
    return embed;
}
const externalPlayerLink = (player) => {
    return ""  +constant.playerLink() + player;
}


const externalHeroLink = (hero) => {
    return ""  +constant.heroLink() + hero;
}

// export
module.exports = {
    getChannelHelp: helpMessage,
    getDmHelp: directHelpMessage,
    getCocHelp: cocHelpMessage,
    getExternalLinkForPlayer: externalPlayerLink,
    getExternalLinkForHero: externalHeroLink
};