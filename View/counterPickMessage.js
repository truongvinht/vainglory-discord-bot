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
        //let resultSupport = cp.getSupport(heroName.toLowerCase());

        if (result != null) {
            return result;
        } else {
            return null;
        }
    } else {
        return null;
    }
}

const roleRandomizer = (message, name, role) => {
    var heroList = [];

    for (let item of cp.getHeroes().content) {
        switch(role) {
            case 'l':
                // laner
                if (item.type == 'laner') {
                    heroList.push(item.name);
                }
                break;
            case 'j':
                // jungler
                if (item.type == 'jungler') {
                    heroList.push(item.name);
                }
                break;
            default:
                // captain
                if (item.type == 'captain') {
                    heroList.push(item.name);
                }
                break;
        }
    }

    let heroIndex = Math.floor(Math.random() * Math.floor(heroList.length));
    var pick = {};

    let userData = message.mentions.users;
    var test = name.replace(/[\\<>@#&!]/g, "");
    if (name.match(/\<\@.*\>/g)) {
        name = userData.get(test).username;
    }

    pick['name'] = name;
    pick['hero'] = heroList[heroIndex];
    pick['spec'] = "";

    let playerPick = [pick];

    switch(role) {
        case 'l':
            // laner
            writePlayer(message, playerPick,colorMng.getColor(16));
            break;
        case 'j':
            // jungler
            writePlayer(message, playerPick,colorMng.getColor(17));
            break;
        default:
            // captain
            writePlayer(message, playerPick,colorMng.getColor(18));
            break;
    }
}

const randomizer = (message, players) => {

    if (players.length > 10) {
        message.channel.send(i18n.get('ErrorToManyNames'));
        return;
    }

    var maxNumCaptain = 1;

    if (players.length > 5) {
        maxNumCaptain = 2;
    }


    // collect hero names
    var heroList = [];
    for (let item of cp.getHeroes().content) {
        heroList.push(item.name);
    }

    let userData = message.mentions.users;

    var playerPick = [];

    for (let index in players) {

        let heroIndex = Math.floor(Math.random() * Math.floor(heroList.length));

        var pick = {};

        var playerName = players[index];
        var test = playerName.replace(/[\\<>@#&!]/g, "");
        if (playerName.match(/\<\@.*\>/g)) {
            playerName = userData.get(test).username;
        }

        pick['name'] = playerName;
        pick['hero'] = heroList[heroIndex];
        pick['spec'] = getRandomSpecs();

        if (pick['spec'] == 'CAP') {
            if (maxNumCaptain > 0) {
                maxNumCaptain = maxNumCaptain - 1;
            } else {
                // pick something else
                while (pick['spec'] == 'CAP') {
                    pick['spec'] = getRandomSpecs();
                }
            }
        }

        playerPick.push(pick);

        heroList.splice(heroIndex,1);
    }
    writePlayer(message, playerPick);
    //console.log("hey " + players[index] + " you play " + heroList[heroIndex] + " " + getRandomSpecs())
}

function writePlayer(message, playerPick, color = colorMng.getColor(15)) {
    if (playerPick.length > 0) {
        var pick = playerPick.shift();

        var d = new Discord.RichEmbed().setColor(color);

        if (pick['spec'] == "") {
            d.setTitle(i18n.get('PlayerXplaysHeroY').replace("$1", pick['name']).replace("$2", pick['hero']).replace("[$3]", pick['spec']));
        } else {
            d.setTitle(i18n.get('PlayerXplaysHeroY').replace("$1", pick['name']).replace("$2", pick['hero']).replace("$3", pick['spec']));
        //d = d.setThumbnail(`${c.imageURL()}/${pick['hero'].toLowerCase()}.png`);
        }
        const avatarImgUrl = `${c.imageURL()}/${pick['hero'].toLowerCase()}.png`;
        d = d.setFooter(`${pick['hero']}`, `${avatarImgUrl}`);


        message.channel.send(d).then(async function (message) {
            await message.react('🔄');
            await message.react('🗑');
            writePlayer(message, playerPick);
        });

    }
}

function getRandomSpecs() {
    
    let spec = Math.floor(Math.random() * Math.floor(3));

    switch(spec) {
        case 0:
            return "WP";
        case 1:
            return "CP";
        default:
            return "CAP";
    }

}

const reloadRandomizer = (message, embed) => {

    // collect hero names
    var heroList = [];
    for (let item of cp.getHeroes().content) {
        heroList.push(item.name);
    }

    var pick = {};
    let heroIndex = Math.floor(Math.random() * Math.floor(heroList.length));
    pick['name'] = embed.title.split(",")[0];
    pick['hero'] = heroList[heroIndex];
    pick['spec'] = getRandomSpecs();

    var d = new Discord.RichEmbed().setColor(colorMng.getColor(15));
    d.setTitle(i18n.get('PlayerXplaysHeroY').replace("$1", pick['name']).replace("$2", pick['hero']).replace("$3", pick['spec']));
        
    const avatarImgUrl = `${c.imageURL()}/${pick['hero'].toLowerCase()}.png`;
    d = d.setFooter(`${pick['hero']}`, `${avatarImgUrl}`);

    message.edit(d);
}

// export
module.exports = {
    getHeroes: heroList,
    getCounter: counterPickHero,
    getQuickCounter: quickCounterPickHero,
    getSupport: supportPickHero,
    getQuickSupport:quickSupportPickHero,
    getGeneral: generalInfo,
    getRandomizer: randomizer,
    getRandomizerForRole: roleRandomizer,
    reloadRandomizer: reloadRandomizer
};