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
        
        return {
            initURL: function(url) {
                
                var reqOption = {
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
                        log.debug(JSON.stringify(response));
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

const data = () => {
    return GameModeHandler.getInstance().content();
}

// export
module.exports = {
    initURL: prepUrl,
    getData: data
};