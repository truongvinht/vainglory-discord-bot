// gameMode.js
// wrapper class for accessing game mode
// ==================

var request = require('request');
var log = require('loglevel');

var GameModeHandler = (function () {
    var instance;
    
    function initInstance() {
        
        //url for request
        var data = "";
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
                        log.debug("game mode list loaded...");
                    } else {
                        log.error("error while loading game mode list json [" +url + "]");
                    }
                });
                return;
            },
            reloadContent: function() {
                request(reqOption, function(error, response, body) {

                    if (!error && response.statusCode == 200) {
                        var json = JSON.parse(body);
                        data = json;
                        log.debug("game mode relist loaded...");
                    } else {
                        log.error("error while reloading game mode list json [" +url + "]");
                    }
                });
                return;
            },
            content: function() {
                return data;
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
    GameModeHandler.getInstance().initURL(url);
}

const reloadUrl = () => {
    GameModeHandler.getInstance().reloadContent();
}

const data = () => {
    return GameModeHandler.getInstance().content();
}

// export
module.exports = {
    initURL: prepUrl,
    getData: data,
    reload: reloadUrl
};