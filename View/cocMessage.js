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
const cocdata = require(`../data/coc-data.json`);

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

let playerStats = function(message, tag) {
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

            if (rawdata.hasOwnProperty("league")) {
                let league = rawdata["league"];
                d.addField(`Liga`,league["name"]);
                if (league.hasOwnProperty("iconUrls")) {
                    let iconUrl = league["iconUrls"];
                    d.setThumbnail(iconUrl["medium"]);
                }
            }

            let cocWeightMap = cocdata.home;

            // TROOPS
            var troopString = "";
            var troopsWeight = 0;

            let troopMap = cocWeightMap.troops;

            for (let troop of rawdata.troops) {
                // only count home village
                if (troop.village == 'home') {
                    troopString = troopString + troop.name + ":" + troop.level + " "

                    if (troopMap.hasOwnProperty(troop.name)) {

                        let levelList = troopMap[troop.name].weight;

                        if (levelList.length > troop.level) {
                            let weight = levelList[troop.level-1];
                            troopsWeight = troopsWeight + weight;
                        } else {
                            console.log(troop.name + " missing level - " + troop.level);
                        }

                    } else {
                        console.log(troop.name + " missing");
                    }
                }
            }
            
            if (troopString.length > 0) {
                d.addField(`Truppen [${formatNumber(troopsWeight)}]`,troopString);
            }

            // SPELL
            var spellString = "";
            var spellWeight = 0;

            let spellMap = cocWeightMap.spells;

            for (let spell of rawdata.spells) {
                // only count home village
                if (spell.village == 'home') {
                    spellString = spellString + spell.name + ":" + spell.level + " ";

                    if (spellMap.hasOwnProperty(spell.name)) {

                        let levelList = spellMap[spell.name].weight;
                        if (levelList.length > spell.level) {
                            let weight = levelList[spell.level-1];
                            spellWeight = spellWeight + weight;
                        } else {
                            console.log(spell.name + " missing level - " + spell.level);
                        }
                    } else {
                        console.log(spell.name + " missing");
                    }
                }
            }
            
            if (spellString.length > 0) {
                d.addField(`Zauber [${formatNumber(spellWeight)}]`,spellString);
            }

            // HERO
            var heroString = "";
            var heroWeight = 0;

            let heroMap = cocWeightMap.heroes;

            for (let heroes of rawdata.heroes) {
                // only count home village
                if (heroes.village == 'home') {
                    heroString = heroString + heroes.name + ": " + heroes.level + "\n";

                    if (heroMap.hasOwnProperty(heroes.name)) {

                        let levelValue = heroMap[heroes.name][0];
                        let weight = levelValue * heroes.level
                        heroWeight = heroWeight + weight;
                    } else {
                        console.log(heroes.name + " missing");
                    }
                }
            }
            
            if (heroString.length > 0) {
                d.addField(`Helden [${formatNumber(heroWeight)}]`,heroString);
            }

            d.setFooter(`Offensive Wertung von ${rawdata["name"]}: ${formatNumber(heroWeight + spellWeight + troopsWeight)}`);
            
            message.channel.send(d);
        }
    };
    coc.setToken(ClashToken.getInstance().token());
    coc.findMember(tag, callback);
}
function formatNumber(num) {
    return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1 ')
}

let checkToken = function(message, token) {
    setToken(token);
    const callback = function(rawdata, error) {
        if (rawdata == null) {
            if (error != null && error != undefined) {

                if (error == "Clan nicht gefunden!") {
                    message.channel.send("Clash Token aktualisiert.");
                    return;
                }

                sendErrorLog(message,error);
                return;
            } else {
                message.channel.send("Clash Token aktualisiert.");
            }
        } else {
            message.channel.send("Clash Token aktualisiert.");
        }
    };

    coc.setToken(ClashToken.getInstance().token());
    // dummy request for receiving error
    coc.getClan("Clash", callback);
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
                    singleClan["stats"] = {"attacks":0, "stars":0,"round":0};
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
                d.setTitle("Clankrieg Runde 1 (Angriffe | Sterne)");

                for (var index = 0;index < 4;index ++ ) {
                    var matchData = rawdata["" + index];
                    const result = getMatchString(matchData);

                    for (let match of [matchData["clan"],matchData["opponent"]]) {
                        let clanTag = match["tag"];
                        var details = clanMap[clanTag];
                        var stats = details["stats"];
                        
                        var attacks = stats["attacks"] + match["attacks"];
                        var stars = stats["stars"] + match["stars"];
                        var round = stats["round"] + 1;
                        details["stats"] = {"attacks":attacks, "stars":stars,"round":round};
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
                    d.setTitle("Clankrieg Runde 2 (Angriffe | Sterne)");

                    for (var index = 0;index < 4;index ++ ) {
                        var matchData = rawdata["" + index];
                        const result = getMatchString(matchData);

                        for (let match of [matchData["clan"],matchData["opponent"]]) {
                            let clanTag = match["tag"];
                            var details = clanMap[clanTag];
                            var stats = details["stats"];
                            
                            var attacks = stats["attacks"] + match["attacks"];
                            var stars = stats["stars"] + match["stars"];
                            var round = stats["round"] + 1;
                            details["stats"] = {"attacks":attacks, "stars":stars,"round":round};
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
                        d.setTitle("Clankrieg Runde 3 (Angriffe | Sterne)");
    
                        for (var index = 0;index < 4;index ++ ) {
                            var matchData = rawdata["" + index];
                            const result = getMatchString(matchData);

                            for (let match of [matchData["clan"],matchData["opponent"]]) {
                                let clanTag = match["tag"];
                                var details = clanMap[clanTag];
                                var stats = details["stats"];
                                
                                var attacks = stats["attacks"] + match["attacks"];
                                var stars = stats["stars"] + match["stars"];
                                var round = stats["round"] + 1;
                                details["stats"] = {"attacks":attacks, "stars":stars,"round":round};
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
                            d.setTitle("Clankrieg Runde 4 (Angriffe | Sterne)");
        
                            for (var index = 0;index < 4;index ++ ) {
                                var matchData = rawdata["" + index];
                                const result = getMatchString(matchData);


                                for (let match of [matchData["clan"],matchData["opponent"]]) {
                                    let clanTag = match["tag"];
                                    var details = clanMap[clanTag];
                                    var stats = details["stats"];
                                    
                                    var attacks = stats["attacks"] + match["attacks"];
                                    var stars = stats["stars"] + match["stars"];
                                    var round = stats["round"] + 1;
                                    details["stats"] = {"attacks":attacks, "stars":stars,"round":round};
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
                                d.setTitle("Clankrieg Runde 5 (Angriffe | Sterne)");
            
                                for (var index = 0;index < 4;index ++ ) {
                                    var matchData = rawdata["" + index];
                                    const result = getMatchString(matchData);
                                    

                                    for (let match of [matchData["clan"],matchData["opponent"]]) {
                                        let clanTag = match["tag"];
                                        var details = clanMap[clanTag];
                                        var stats = details["stats"];
                                        
                                        var attacks = stats["attacks"] + match["attacks"];
                                        var stars = stats["stars"] + match["stars"];
                                        var round = stats["round"] + 1;
                                        details["stats"] = {"attacks":attacks, "stars":stars,"round":round};
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
                                    d.setTitle("Clankrieg Runde 6 (Angriffe | Sterne)");
                
                                    for (var index = 0;index < 4;index ++ ) {
                                        var matchData = rawdata["" + index];
                                        const result = getMatchString(matchData);

                                        for (let match of [matchData["clan"],matchData["opponent"]]) {
                                            let clanTag = match["tag"];
                                            var details = clanMap[clanTag];
                                            var stats = details["stats"];
                                            
                                            var attacks = stats["attacks"] + match["attacks"];
                                            var stars = stats["stars"] + match["stars"];
                                            var round = stats["round"] + 1;
                                            details["stats"] = {"attacks":attacks, "stars":stars,"round":round};
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
                                        d.setTitle("Clankrieg Runde 7 (Angriffe | Sterne)");
                    
                                        for (var index = 0;index < 4;index ++ ) {
                                            var matchData = rawdata["" + index];
                                            const result = getMatchString(matchData);

                                            for (let match of [matchData["clan"],matchData["opponent"]]) {
                                                let clanTag = match["tag"];
                                                var details = clanMap[clanTag];
                                                var stats = details["stats"];
                                                
                                                var attacks = stats["attacks"] + match["attacks"];
                                                var stars = stats["stars"] + match["stars"];
                                                var round = stats["round"] + 1;
                                                details["stats"] = {"attacks":attacks, "stars":stars,"round":round};
                                                clanMap[clanTag] = details;
                                            }

                                            d.addField(result[0],result[1]);
                                        }
                                        
                                        message.channel.send(d);
                                        getCWLSummary(message,clanMap);
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

let cwlm = function(message, tag) {

    const callback = function(rawdata, error) {

        if (rawdata == null) {
            if (error != null && error != undefined) {
                sendErrorLog(message,error);
                return;
            }
            message.channel.send(error);
        } else {
            let clans = rawdata["clans"];

            for (let c of clans) {
                if (c.tag.includes(tag)) {

                    var d = new Discord.RichEmbed().setColor("#FEF995");
                    d.setTitle("Clankrieg Teilnehmer - " + c.name + "/" + c.tag + " (" + c.members.length + ")");
                    
                    var listOfMembers = c.members;

                    listOfMembers.sort(function(a, b) {
                        return b.townHallLevel - a.townHallLevel;
                    });


                    var members = "";

                    for (let m of listOfMembers) {
                        members = members + m.name + " / RH" + m.townHallLevel + "\n";
                    }

                    d.setDescription(members);
                    message.channel.send(d);
                }
            }



        }
    };
    coc.setToken(ClashToken.getInstance().token());
    coc.getCWL(tag, callback);
}

function getMatchString(matchData) {
    var matchDataClan = matchData["clan"];
    var matchDataOpponent = matchData["opponent"];
    var head = `${matchDataClan["name"]} [${matchDataClan["clanLevel"]}] vs ${matchDataOpponent["name"]} [${matchDataOpponent["clanLevel"]}]`;
    var subtitle = `${matchDataClan["name"]}: ${matchDataClan["attacks"]} | ${matchDataClan["stars"]}\n` + 
                    `${matchDataOpponent["name"]}: ${matchDataOpponent["attacks"]} | ${matchDataOpponent["stars"]}`;
    return [head,subtitle];                
}

function getCWLSummary(message, clandetails) {
    var d = new Discord.RichEmbed().setColor("#FEF995");

    d.setTitle("Clankrieg Übersicht");

    for (let k of Object.keys(clandetails)) {
        let clan = clandetails[k];
        let playersCount = clan.members.length;

        var sum = 0;

        for (let pl of clan.members) {
            sum = sum + pl.townHallLevel;
        }

        var header = `${clan["name"]} - ${clan["tag"]}`;
        let stats = clan["stats"];
        var content = `Angriffe: ${stats["attacks"]}\nSterne: ${stats["stars"]}\nTeam: ${playersCount}\nAvg RH: ${(sum * 1.0 / playersCount).toFixed(2)}`;
        d.addField(header,content);
    }
    message.channel.send(d);
}

function prepareRound(roundList, callback, finalCallback) {
    let match1Tag = roundList[0];
    let match2Tag = roundList[1];
    let match3Tag = roundList[2];
    let match4Tag = roundList[3];
    let match5Tag = roundList[4];
    let match6Tag = roundList[5];
    var matchups = {};

    if (match1Tag == "#0" || match2Tag == "#0" || match3Tag == "#0" || match4Tag == "#0" || match5Tag == "#0" || match6Tag == "#0") {
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

                    const call5 = function(r5,k5, e5) {
                        matchups[k5] = r5;
        
                        const call6 = function(r6,k6, e6) {
                            matchups[k6] = r6;
                            callback(matchups);
                        };
                        coc.setToken(ClashToken.getInstance().token());
                        coc.getCWLMatch(match4Tag,"5", call6);
                    };
                    coc.setToken(ClashToken.getInstance().token());
                    coc.getCWLMatch(match4Tag,"4", call5);
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

    if (error == null || error == undefined) {
        message.channel.send('undefined');
    }
    try{

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
    catch(e){
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
    getPlayerStats:playerStats,
    getCWL: cwl,
    getCWLM: cwlm,
    findClan: clanfinder,
    checkToken: checkToken,
    findMember: memberfinder
};