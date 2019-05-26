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
    const callback = function(rawdata, error) {
        if (rawdata == null) {
            if (error != null && error != undefined) {
                sendErrorLog(message,error);
                return;
            }
            message.channel.send(error);
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
                " | " + league["name"] + "[" + member["donations"] + "/" + member["donationsReceived"] + "]" + " | " + member["tag"] +"\n";

                if (output.length > 1800) {
                    d.setDescription(output);
                    message.channel.send(d);

                    d = new Discord.RichEmbed().setColor("#FEF990");
                    d.setTitle(rawdata["name"]);
                    output = "";
                }
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

let cwl = function(message, tag) {
    const callback = function(rawdata, error) {

        var clanMap = {};
        var finalCallback = function() {

        };

        if (rawdata == null) {
            if (error != null && error != undefined) {
                sendErrorLog(message,error);
                return;
            }
            message.channel.send(error);
        } else {

            var clandetails = null;

            for (let clan of rawdata["clans"]) {
                if (clan["tag"].includes(tag)) {
                    clandetails = clan;
                    break;
                }
            }

            if (clandetails == null) {
                message.channel.send("Keine Daten zum CWL gefunden.");
            } else{
                var d = new Discord.RichEmbed().setColor("#FEF995");

                d.setTitle("Clankrieg " + clandetails["name"] + " [" + clandetails["tag"] +"]");
                const badges = clandetails["badgeUrls"];
                d.setThumbnail(clandetails["medium"]);

                var text = "";

                for (var i=0;i<rawdata["clans"].length;i++) {
                    var detail = rawdata["clans"];
                    var singleClan = detail[i];
                    singleClan["stats"] = {"attacks":0, "stars":0,"destructionPercentage":0.0,"round":0};
                    var team = singleClan;
                    clanMap[singleClan["tag"]] = singleClan;
                    text = `${text}${i+1}. ${singleClan["name"]} [${team["clanLevel"]}] - ${team["tag"]}\n`;
                }

                if (text != "") {
                    d.setDescription(text);
                } else {
                    d.setDescription("-");
                    message.channel.send(d);
                    return;
                }

            }

            let roundList = rawdata["rounds"];

            let callbackRound1  = function(rawdata) {
                var d = new Discord.RichEmbed().setColor("#FEF910");
                d.setTitle("Clankrieg Runde 1 (Angriffe | Sterne | Prozent)");

                for (var index = 0;index < 4;index ++ ) {
                    var matchData = rawdata["" + index];
                    const result = getMatchString(matchData);

                    for (let match of [matchData["clan"],matchData["opponent"]]) {
                        let clanTag = match["tag"];
                        var details = clanMap[clanTag];
                        var stats = details["stats"];
                        
                        var attacks = stats["attacks"] + match["attacks"];
                        var stars = stats["stars"] + match["stars"];
                        var destructionPercentage = stats["destructionPercentage"] + match["destructionPercentage"];
                        var round = stats["round"] + 1;
                        details["stats"] = {"attacks":attacks, "stars":stars,"destructionPercentage":destructionPercentage,"round":round};
                        clanMap[clanTag] = details;
                    }

                    d.addField(result[0],result[1]);
                }
                
                message.channel.send(d);
                
                finalCallback = function() {
                    getCWLSummary(message,clanMap);
                };

                let callbackRound2  = function(rawdata) {
                    var d = new Discord.RichEmbed().setColor("#FEF910");
                    d.setTitle("Clankrieg Runde 2 (Angriffe | Sterne | Prozent)");

                    for (var index = 0;index < 4;index ++ ) {
                        var matchData = rawdata["" + index];
                        const result = getMatchString(matchData);

                        for (let match of [matchData["clan"],matchData["opponent"]]) {
                            let clanTag = match["tag"];
                            var details = clanMap[clanTag];
                            var stats = details["stats"];
                            
                            var attacks = stats["attacks"] + match["attacks"];
                            var stars = stats["stars"] + match["stars"];
                            var destructionPercentage = stats["destructionPercentage"] + match["destructionPercentage"];
                            var round = stats["round"] + 1;
                            details["stats"] = {"attacks":attacks, "stars":stars,"destructionPercentage":destructionPercentage,"round":round};
                            clanMap[clanTag] = details;
                        }

                        d.addField(result[0],result[1]);
                    }
                    
                    message.channel.send(d);
                
                    finalCallback = function() {
                        getCWLSummary(message,clanMap);
                    };

                    let callbackRound3  = function(rawdata) {
                        var d = new Discord.RichEmbed().setColor("#FEF910");
                        d.setTitle("Clankrieg Runde 3 (Angriffe | Sterne | Prozent)");
    
                        for (var index = 0;index < 4;index ++ ) {
                            var matchData = rawdata["" + index];
                            const result = getMatchString(matchData);

                            for (let match of [matchData["clan"],matchData["opponent"]]) {
                                let clanTag = match["tag"];
                                var details = clanMap[clanTag];
                                var stats = details["stats"];
                                
                                var attacks = stats["attacks"] + match["attacks"];
                                var stars = stats["stars"] + match["stars"];
                                var destructionPercentage = stats["destructionPercentage"] + match["destructionPercentage"];
                                var round = stats["round"] + 1;
                                details["stats"] = {"attacks":attacks, "stars":stars,"destructionPercentage":destructionPercentage,"round":round};
                                clanMap[clanTag] = details;
                            }
                            d.addField(result[0],result[1]);
                        }
                        
                        message.channel.send(d);
                
                        finalCallback = function() {
                            getCWLSummary(message,clanMap);
                        };

                        let callbackRound4  = function(rawdata) {
                            var d = new Discord.RichEmbed().setColor("#FEF910");
                            d.setTitle("Clankrieg Runde 4 (Angriffe | Sterne | Prozent)");
        
                            for (var index = 0;index < 4;index ++ ) {
                                var matchData = rawdata["" + index];
                                const result = getMatchString(matchData);


                                for (let match of [matchData["clan"],matchData["opponent"]]) {
                                    let clanTag = match["tag"];
                                    var details = clanMap[clanTag];
                                    var stats = details["stats"];
                                    
                                    var attacks = stats["attacks"] + match["attacks"];
                                    var stars = stats["stars"] + match["stars"];
                                    var destructionPercentage = stats["destructionPercentage"] + match["destructionPercentage"];
                                    var round = stats["round"] + 1;
                                    details["stats"] = {"attacks":attacks, "stars":stars,"destructionPercentage":destructionPercentage,"round":round};
                                    clanMap[clanTag] = details;
                                }
                                
                                d.addField(result[0],result[1]);
                            }
                            
                            message.channel.send(d);
                
                            finalCallback = function() {
                                getCWLSummary(message,clanMap);
                            };

                            let callbackRound5  = function(rawdata) {
                                var d = new Discord.RichEmbed().setColor("#FEF910");
                                d.setTitle("Clankrieg Runde 5 (Angriffe | Sterne | Prozent)");
            
                                for (var index = 0;index < 4;index ++ ) {
                                    var matchData = rawdata["" + index];
                                    const result = getMatchString(matchData);
                                    

                                    for (let match of [matchData["clan"],matchData["opponent"]]) {
                                        let clanTag = match["tag"];
                                        var details = clanMap[clanTag];
                                        var stats = details["stats"];
                                        
                                        var attacks = stats["attacks"] + match["attacks"];
                                        var stars = stats["stars"] + match["stars"];
                                        var destructionPercentage = stats["destructionPercentage"] + match["destructionPercentage"];
                                        var round = stats["round"] + 1;
                                        details["stats"] = {"attacks":attacks, "stars":stars,"destructionPercentage":destructionPercentage,"round":round};
                                        clanMap[clanTag] = details;
                                    }
                                    d.addField(result[0],result[1]);
                                }
                                
                                message.channel.send(d);
                
                                finalCallback = function() {
                                    getCWLSummary(message,clanMap);
                                };

                                let callbackRound6  = function(rawdata) {
                                    var d = new Discord.RichEmbed().setColor("#FEF910");
                                    d.setTitle("Clankrieg Runde 6 (Angriffe | Sterne | Prozent)");
                
                                    for (var index = 0;index < 4;index ++ ) {
                                        var matchData = rawdata["" + index];
                                        const result = getMatchString(matchData);

                                        for (let match of [matchData["clan"],matchData["opponent"]]) {
                                            let clanTag = match["tag"];
                                            var details = clanMap[clanTag];
                                            var stats = details["stats"];
                                            
                                            var attacks = stats["attacks"] + match["attacks"];
                                            var stars = stats["stars"] + match["stars"];
                                            var destructionPercentage = stats["destructionPercentage"] + match["destructionPercentage"];
                                            var round = stats["round"] + 1;
                                            details["stats"] = {"attacks":attacks, "stars":stars,"destructionPercentage":destructionPercentage,"round":round};
                                            clanMap[clanTag] = details;
                                        }

                                        d.addField(result[0],result[1]);
                                    }
                                    
                                    message.channel.send(d);
                
                                    finalCallback = function() {
                                        getCWLSummary(message,clanMap);
                                    };

                                    let callbackRound7  = function(rawdata) {
                                        var d = new Discord.RichEmbed().setColor("#FEF910");
                                        d.setTitle("Clankrieg Runde 7 (Angriffe | Sterne | Prozent)");
                    
                                        for (var index = 0;index < 4;index ++ ) {
                                            var matchData = rawdata["" + index];
                                            const result = getMatchString(matchData);

                                            for (let match of [matchData["clan"],matchData["opponent"]]) {
                                                let clanTag = match["tag"];
                                                var details = clanMap[clanTag];
                                                var stats = details["stats"];
                                                
                                                var attacks = stats["attacks"] + match["attacks"];
                                                var stars = stats["stars"] + match["stars"];
                                                var destructionPercentage = stats["destructionPercentage"] + match["destructionPercentage"];
                                                var round = stats["round"] + 1;
                                                details["stats"] = {"attacks":attacks, "stars":stars,"destructionPercentage":destructionPercentage,"round":round};
                                                clanMap[clanTag] = details;
                                            }

                                            d.addField(result[0],result[1]);
                                        }
                                        
                                        message.channel.send(d);

                                        
                
                                        finalCallback = function() {
                                            getCWLSummary(message,clanMap);
                                        };
                                    };
                                    prepareRound(roundList[6].warTags,callbackRound7,finalCallback);
                                };
                                prepareRound(roundList[5].warTags,callbackRound6,finalCallback);
                            };
                            prepareRound(roundList[4].warTags,callbackRound5,finalCallback);
                        };
                        prepareRound(roundList[3].warTags,callbackRound4,finalCallback);
                    };
                    prepareRound(roundList[2].warTags,callbackRound3,finalCallback);
                };
                prepareRound(roundList[1].warTags,callbackRound2,finalCallback);
            };
            prepareRound(roundList[0].warTags,callbackRound1,finalCallback);
        }
    }
    coc.setToken(ClashToken.getInstance().token());
    coc.getCWL(tag, callback);
}

function getMatchString(matchData) {
    var matchDataClan = matchData["clan"];
    var matchDataOpponent = matchData["opponent"];
    var head = `${matchDataClan["name"]} [${matchDataClan["clanLevel"]}] vs ${matchDataOpponent["name"]} [${matchDataOpponent["clanLevel"]}]`;
    var subtitle = `${matchDataClan["name"]}: ${matchDataClan["attacks"]} | ${matchDataClan["stars"]} | ${matchDataClan["destructionPercentage"].toFixed(2)}\n` + 
                    `${matchDataOpponent["name"]}: ${matchDataOpponent["attacks"]} | ${matchDataOpponent["stars"]} | ${matchDataOpponent["destructionPercentage"].toFixed(2)}`;
    return [head,subtitle];                
}

function getCWLSummary(message, clandetails) {
    var d = new Discord.RichEmbed().setColor("#FEF995");

    d.setTitle("Clankrieg Übersicht");

    for (let k of Object.keys(clandetails)) {
        let clan = clandetails[k];
        var header = `${clan["name"]} - ${clan["tag"]}`;
        let stats = clan["stats"];

        let avg = stats["destructionPercentage"] /  (stats["round"]-1);
        var content = `Angriffe: ${stats["attacks"]}\nSterne: ${stats["stars"]}\nDurschnittlich Zerstört: ${avg.toFixed(2)}`;
        d.addField(header,content);
    }
    message.channel.send(d);
}

function prepareRound(roundList, callback, finalCallback) {
    let match1Tag = roundList[0];
    let match2Tag = roundList[1];
    let match3Tag = roundList[2];
    let match4Tag = roundList[3];
    var matchups = {};

    if (match1Tag == "#0" || match2Tag == "#0" || match3Tag == "#0" || match4Tag == "#0" ) {
        //skip
        finalCallback();
        return;
    }


    const call1 = function(r1,k1, e1) {
        matchups[k1] = r1;
        const call2 = function(r2,k2, e2) {
            matchups[k2] = r2;
            
            const call3 = function(r3,k3, e3) {
                matchups[k3] = r3;

                const call4 = function(r4,k4, e4) {
                    matchups[k4] = r4;
                    callback(matchups);
                };
                coc.setToken(ClashToken.getInstance().token());
                coc.getCWLMatch(match4Tag,"3", call4);
            };
            coc.setToken(ClashToken.getInstance().token());
            coc.getCWLMatch(match3Tag,"2", call3);
        };
        coc.setToken(ClashToken.getInstance().token());
        coc.getCWLMatch(match2Tag,"1", call2);
    };
    coc.setToken(ClashToken.getInstance().token());
    coc.getCWLMatch(match1Tag,"0", call1);
}

let clanfinder = function(message, name) {
    const callback = function(rawdata, error) {

        if (rawdata == null) {
            if (error != null && error != undefined) {
                sendErrorLog(message,error);
                return;
            }
            message.channel.send(error);
        } else {
            var d = new Discord.RichEmbed().setColor("#FEF991");

            if (rawdata["items"].length == 0) {
                d.setTitle("Keinen Clan gefunden [" + name +"].");
            } else {
                d.setTitle(`Suche nach '${name}'...`);
                for (let clan of rawdata["items"]) {
                    var locationString = "";
                    if (clan["location"] != undefined) {
                        const location = clan["location"];
                        locationString = `, Land: ${location["name"]}`;
                    }
                    d.addField(`${clan["name"]} [${clan["tag"]}] - Clanlevel ${clan["clanLevel"]}`,`Art: ${clan["type"]}, Min. Trophäen: ${clan["requiredTrophies"]}, Mitglieder: ${clan["members"]}${locationString}`);
                }
            }
    
    
            message.channel.send(d);
        }

    };
    coc.setToken(ClashToken.getInstance().token());
    coc.findClan(name, callback);
}

let memberfinder = function(message, tag) {
    const callback = function(rawdata, error) {

        if (rawdata == null) {
            if (error != null && error != undefined) {
                sendErrorLog(message,error);
                return;
            }
            message.channel.send(error);
        } else {
            var d = new Discord.RichEmbed().setColor("#FEF992");
            
            d.setTitle(rawdata["name"] + " - Level " +rawdata["expLevel"]);
            d.addField(`Tag`,rawdata["tag"]);
            
            d.addField(`Rathaus-Level`,rawdata["townHallLevel"]);

            if (rawdata.hasOwnProperty("league")) {
                let league = rawdata["league"];
                d.addField(`Liga`,league["name"]);
                if (league.hasOwnProperty("iconUrls")) {
                    let iconUrl = league["iconUrls"];
                    d.setThumbnail(iconUrl["medium"]);
                }
            }
            d.addField(`Trophäen`,rawdata["trophies"]);
            d.addField(`Bestes Ergebnis`,rawdata["bestTrophies"]);
            d.addField(`Gewonnene Kriegssterne`,rawdata["warStars"]);

            d.addField(`Rolle`,rawdata["role"]);
            d.addField(`Gespendet/Erhalten`,rawdata["donations"] + " / " + rawdata["donationsReceived"]);
            d.addField(`Gewonnene Angriffe/Verteidigungen`,rawdata["attackWins"] + " / " + rawdata["defenseWins"]);

            if (rawdata.hasOwnProperty("clan")) {
                let clan = rawdata["clan"];
                let badge = clan["badgeUrls"];
                d.setFooter(`${clan["name"]} [${clan["clanLevel"]}] - ${clan["tag"]}`,badge["medium"]);
            }
            message.channel.send(d);
        }

    };
    coc.setToken(ClashToken.getInstance().token());
    coc.findMember(tag, callback);
}

function sendErrorLog(message, error) {
    let errorMap = JSON.parse(error);
    if (errorMap.hasOwnProperty("reason") && errorMap.reason == "accessDenied.invalidIp") {
        console.log(errorMap.message);
        message.author.send(errorMap.message);
        message.author.send("https://developer.clashofclans.com/#/");
    } else if(errorMap.hasOwnProperty("reason") && errorMap.reason == "accessDenied") {
        message.author.send(errorMap.message);
    } else {
        message.channel.send(error);
    }
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
    getCWL: cwl,
    findClan: clanfinder,
    findMember: memberfinder
};