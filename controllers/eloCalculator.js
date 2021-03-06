// eloCalculator.js
// request information regarding given elo points
// ==================

var request = require('request');
var log = require('loglevel');

var EloManager = (function () {
    var instance;
    
    function initInstance() {
        
        //url for request
        var data = "";

        //request header
        var reqOption = {};

        return {
            initURL: function(url) {
                reqOption = {
                    url: url,
                    headers: {
                        'User-Agent': 'request',
                        'Accept': 'application/json'
                    }
                };
                request(reqOption, function(error, response, body) {
                    if (!error && response.statusCode == 200) {
                        var json = JSON.parse(body);
                        data = json;
                        log.debug("elo list loaded...");
                    } else {
                        log.error("error while loading elo json");
                    }
                });
                return;
            },

            reloadContent: function() {
                request(reqOption, function(error, response, body) {

                    if (!error && response.statusCode == 200) {
                        var json = JSON.parse(body);
                        data = json;
                        log.debug("elo list reloaded...");
                    } else {
                        log.error("error while reloading elo json");
                    }
                });
                return;
            },
            
            calculate: function(points) {
                
                if (data=="") {
                    return null;
                }
                
                const keys = Object.keys(data);
                for(var i=0;i<keys.length;i++){
                    
                    const details = data[i];
                    
                    const title = details["title"];
                    
                    const start = details["starts"];
                    const ends = details["ends"];
                
                     if (points >= start && points <= ends) {

                        var next = -1.0;

                        if (keys.length-1 > i) {
                            const nextObj = data[i+1];
                            next = nextObj["starts"] - points;
                        }

                         var contentData = {
                             "title":title,
                             "elo":i,
                             "missing": next
                         };
                         return contentData;
                     }
                }
                return null;
            },
            score: function(index) {
                return data[index];
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

// initialize url for points json
const prepUrl = function(url) {
    EloManager.getInstance().initURL(url);
}

// reload json file
const reloadUrl = () => {
    EloManager.getInstance().reloadContent();
}

// prepare data for displaying
const calculate = function(points) {
    var instance = EloManager.getInstance();
    return instance.calculate(points);
}

const score = function(index) {
    var instance = EloManager.getInstance();
    return instance.score(index);
}

// function to get random message for tier
const randomMessage = () => {
    const MAX_RANDOM = 24;
    
    const random = Math.floor((Math.random() * MAX_RANDOM) + 1);
    return `Random${random}`;
}

// export
module.exports = {
    initURL: prepUrl,
    getResult: calculate,
    getScore: score,
    getMessage: randomMessage,
    reload: reloadUrl
};