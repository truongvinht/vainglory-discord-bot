// cocMessage.js
// Clash of clans related messages
// ================

//import
const Discord = require("discord.js");
const i18n = require('../general/langSupport');
const c = require("../general/constLoader");
const fm = require('../general/contentFormatter');
const access = require('../general/accessRightManager');
const colorMng = require('../controllers/messageColorManager');
const strH = require('../general/stringHelper');

//logger
const log = require('loglevel');

// CONTROLLERS
var coc = require('../controllers/cocHandler');

const formatter = require('../general/contentFormatter');


//singleton instance of clash token manager for handling api token 
var ClashToken = (function () {
    var instance;
    
    function initInstance() {
        var clashToken = "";
        
        //map for collecting matches (show details)
        var matchMap = {};
        
        return {
            //update token
            updateToken: function(updatedToken) {
                clashToken = updatedToken;
            },
            //read token
            token: function() {
                return clashToken;
            }
        }
    }
    return {
        getInstance: function() {
            if (!instance) {
                instance = initInstance();
            }
            return instance;
        } 
    };
})();

let clan = function(message, tag) {
    const callback = function(rawdata) {
        if (rawdata == null) {
            message.channel.send("-");
        } else {
            var d = new Discord.RichEmbed().setColor("#FEF99F");
            d.setTitle(rawdata["name"] + " [" + rawdata["tag"] +"]");
            d.setDescription(rawdata["description"]);
            const badges = rawdata["badgeUrls"];
            d.setThumbnail(badges["medium"]);

            d.addField(`Clan Level`,rawdata["clanLevel"]);
            d.addField(`Gesamtpunkte:`,`${rawdata["clanPoints"]} / ${rawdata["clanVersusPoints"]}`);
            d.addField(`Gewonnene Kriege`,rawdata["warWins"]);
            d.addField(`Siegesserie`,rawdata["warWinStreak"]);
            d.addField(`Mitglieder`,`${rawdata["members"]} / 50`);
            d.addField(`Benötigte Trophäen`,rawdata["requiredTrophies"]);
            d.addField(`Kriegshäufigkeit`,rawdata["warFrequency"]);

            if (rawdata["location"] != undefined && rawdata["location"] != null) {
                const location = rawdata["location"];
                d.addField(`Clanregion`,location["name"]);
            } 


            message.channel.send(d);

            d = new Discord.RichEmbed().setColor("#FEF990");
            d.setTitle(rawdata["name"] + " Mitglieder (" +rawdata["members"]+ ")");
            d.setThumbnail(badges["medium"]);

            var output = "";
            for (let member of rawdata["memberList"]) {
                let league = member["league"]
                output = output + "__" + member["name"]+ "__" + 
                " | " + league["name"] + " [" + member["donations"] + " / " + member["donationsReceived"] + "]" +"\n";
            }
            d.setDescription(output);
            message.channel.send(d);



            // for (let member of rawdata["memberList"]) {
            //     let league = member["league"];
            //     let iconUrl = league["iconUrls"];
            //     d = new Discord.RichEmbed().setColor("#FEF99F");
            //     d.setTitle(member["name"] + " (" +member["expLevel"] +")");

            //     d.setThumbnail(iconUrl["medium"]);
            //     d.addField(`Rolle`,member["role"]);
            //     d.addField(`Liga`,league["name"]);
            //     d.addField(`Gespendet/Erhalten`,member["donations"] + " / " + member["donationsReceived"]);
            //     message.channel.send(d);
            // }
        }
    };
    coc.setToken(ClashToken.getInstance().token());
    coc.getClan(tag, callback);
}

/**
 * Function to set/update clash of clans API token
 * @param {String} token clash of clans API token for requests
 */
const setToken = (token) => {
    ClashToken.getInstance().updateToken(token);
}

/**
 * Function to get current Vainglory API Token
 * @returns current Vainglory API token
 * @type String
 */
const getToken = () => {
    ClashToken.getInstance().token();
}


//export
module.exports = {
    setToken: setToken,
    getToken: getToken,
    getClan: clan,
};