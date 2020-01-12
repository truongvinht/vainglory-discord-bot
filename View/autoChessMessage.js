// autoChessMessage.js
// AutoChess related messages
// ================

//import 
const Discord = require("discord.js");
const i18n = require('../general/langSupport');
const c = require("../general/constLoader");
const colorMng = require('../controllers/messageColorManager');

const RACE_LIST = [
    "Human",
    "Feathered",
    "Demon",
    "Goblin",
    "Beast",
    "Glacier",
    "Dragon",
    "Divinity"
];

const CLASS_LIST = [
    "Mech",
    "Mage",
    "Warlock",
    "Assasin",
    "Knight",
    "Hunter",
    "Warrior"
];


// race randomizer
const randomizerRace = (message, players) => {

    if (players.length > 4) {
        message.channel.send(i18n.get('ErrorToManyNames'));
        return;
    }

    var playerPick = [];

    let userData = message.mentions.users;

    for (let index in players) {

        let pickedIndex = Math.floor(Math.random() * Math.floor(RACE_LIST.length));

        var pick = {};


        var playerName = players[index];
        var test = playerName.replace(/[\\<>@#&!]/g, "");
        if (playerName.match(/\<\@.*\>/g)) {
            playerName = userData.get(test).username;
        }

        pick['name'] = playerName;
        pick['hero'] = RACE_LIST[pickedIndex];

        playerPick.push(pick);
    }

    writePlayer(message, playerPick);
}


// race randomizer
const randomizerClass = (message, players) => {

    if (players.length > 4) {
        message.channel.send(i18n.get('ErrorToManyNames'));
        return;
    }

    var playerPick = [];

    let userData = message.mentions.users;

    for (let index in players) {

        let pickedIndex = Math.floor(Math.random() * Math.floor(CLASS_LIST.length));

        var pick = {};

        var playerName = players[index];
        var test = playerName.replace(/[\\<>@#&!]/g, "");
        if (playerName.match(/\<\@.*\>/g)) {
            playerName = userData.get(test).username;
        }

        pick['name'] = playerName;
        pick['hero'] = CLASS_LIST[pickedIndex];

        playerPick.push(pick);
    }

    writePlayer(message, playerPick);
}


// race/class randomizer without taken one
const random = (message, players) => {

    if (players.length > 4) {
        message.channel.send(i18n.get('ErrorToManyNames'));
        return;
    }

    var playerPick = [];

    let userData = message.mentions.users;

    for (let index in players) {

        var pickedSynergy = getRandomSynergy();

        while(hasSynergy(pickedSynergy, playerPick)) {
            pickedSynergy = getRandomSynergy();
        }
        
        var playerName = players[index];
        var test = playerName.replace(/[\\<>@#&!]/g, "");
        if (playerName.match(/\<\@.*\>/g)) {
            playerName = userData.get(test).username;
        }

        var pick = {};
        pick['name'] = playerName;
        pick['hero'] = pickedSynergy;

        playerPick.push(pick);
    }

    writePlayer(message, playerPick);
}

const getRandomSynergy = () => {

    var synergyList;

    if (Math.random() >= 0.5) {
        synergyList = CLASS_LIST;
    } else {
        synergyList = RACE_LIST;
    }

    var pickedIndex = Math.floor(Math.random() * Math.floor(synergyList.length));

    return synergyList[pickedIndex];
}

function hasSynergy(synergy, pickedList) {
    for (let pick in pickedList) {
        if (pick["hero"] == synergy) {
            return true;
        }
    }
    return false;
}

function writePlayer(message, playerPick, color = colorMng.getColor(15), editing = false) {
    if (playerPick.length > 0) {
        var pick = playerPick.shift();

        var d = new Discord.RichEmbed().setColor(color);

        d.setTitle(i18n.get('PlayerXplaysHeroY').replace("$1", pick['name']).replace("$2", pick['hero']).replace("[$3]", "Synergie"));

        if (editing) {
            message.edit(d);
        } else {
            message.channel.send(d).then(async function (message) {
                await message.react('🗑');
                writePlayer(message, playerPick);
            });
        }

    }
}

//export
module.exports = {
    getRandomRace: randomizerRace,
    getRandomClass: randomizerClass,
    getRandom:random
};