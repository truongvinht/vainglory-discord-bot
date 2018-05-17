// itemHandler.js
// Handle items for heroes
// ==================

// import 
const request = require('request');
const c = require("../general/constLoader");

//item list
const i18n = require('../general/langSupport');
var log = require('loglevel');

const TIER_LIST = ['Tier 1','Tier 2','Tier 3'];
const RELEASE_VERSION = ['3.0','3.1',"3.2","3.3"];

var ItemDescriptionManager = (function () {
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
                        log.debug("item list loaded...");
                    } else {
                        log.error("error while loading item list json [" +url + "]");
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

function getItemList() {
    return ItemDescriptionManager.getInstance().content();
}


//FILTER LEVEL: CATEGORY TIER INDEX

const categoryList = function() {
    
    // list for output
    var list = "";
    var rawList = [];
    
    for (var key of Object.keys(getItemList().category)) {
        list = list + "[" + `${key}` + "] " + getItemList().category[key] + "\n";
        rawList.push(getItemList().category[key]);
    }

    let content = {
        "title": `${i18n.get('ListAvailableCategories')} [${Object.keys(getItemList().category).length}]`,
        "content": list,
        "count":Object.keys(getItemList().category).length,
        "items":rawList
    }

    return content;
}

// get tier list
const tierList = function() {
    
    // list for output
    var list = "";
    var rawList = [];
    
    for (var t of TIER_LIST) {
        list = list + "[" + `${TIER_LIST.indexOf(t)+1}` + "] " + t + "\n";
        rawList.push(t);
    }

    let content = {
        "title": `${i18n.get('ListAvailableTiers')}`,
        "content": list,
        "count": TIER_LIST.length,
        "items":rawList
    }
    
    return content;
}

const list = function(category, tier) {
    
    //fetch all items into an array
    var items = [];
    
    for (var key of Object.keys(getItemList().item)) {
        
        var itm = getItemList().item[key];
        
        var needsSkipping = false;
        
        //check each version
        for (var index = RELEASE_VERSION.length-1; index >= 0; index--) {
            
            let singleItem = itm[`${RELEASE_VERSION[index]}`]; 

            if (Object.keys(singleItem).length == 0) {
                continue;
            }
            if (singleItem.hasOwnProperty('name')) {
                if (singleItem.hasOwnProperty('tier')) {
                    //check tier first
                    if (singleItem.tier!=parseInt(tier)) {
                        needsSkipping = true;
                        break;
                    }
                }
            }
            
            if (singleItem.hasOwnProperty('category')) {
                //check category with a for loop
                for (var ctg of singleItem.category) {
                    if (ctg == category) {
                        
                        var combinedItem = singleItem;
                        
                        //latest object
                        if (index == RELEASE_VERSION.length-1) {
                            let prevItem = itm[`${RELEASE_VERSION[index-1]}`]; 
                            combinedItem["old"] = prevItem;
                        }
                        
                        items.push(combinedItem);
                        needsSkipping = true;
                        break;
                    }
                }
                
                if (items[items.length-1] == singleItem) {
                    break;
                }
            }
        }
        
        //skip because tier or category doesn't match
        if (needsSkipping) {
            continue;
        }
    }
    
    // list for output
    var list = "";
    
    for (var i of items) {
        
        const code = (i.hasOwnProperty('code'))?` (${i.code})`:"";
        
        list = list + "[" + `${items.indexOf(i)+1}` + "] " + i.name + ` ${code}\n`;
    }
    
    return {"title":`${i18n.get('ListOfMatchingItems')}`,"content":list,"items":items};
}

const singleItemCode = function(code) {
    
    for (var key of Object.keys(getItemList().item)) {
        
        var itm = getItemList().item[key];
        
        //check each version
        for (var index = RELEASE_VERSION.length-1; index >= 0; index--) {

            var singleItem = itm[`${RELEASE_VERSION[index]}`]; 
            
            if (Object.keys(singleItem).length == 0) {
                continue;
            }
            
            if (singleItem.hasOwnProperty('code')) {
                if (singleItem.code == code.toUpperCase()) {
                    return singleItem;
                }
            }
        }
    }
    return null;
}

const singleItem = function(name) {
    
    for (var key of Object.keys(getItemList().item)) {
        
        var itm = getItemList().item[key];
        
        //check each version
        for (var index = RELEASE_VERSION.length-1; index >= 0; index--) {

            var singleItem = itm[`${RELEASE_VERSION[index]}`]; 
            
            if (Object.keys(singleItem).length == 0) {
                continue;
            }
            
            if (singleItem.hasOwnProperty('name')) {
                if (singleItem.name.toUpperCase() == name.toUpperCase()) {
                    return singleItem;
                }
            }
        }
    }
    return null;
}

const updatedList = function(version) {
    
    //fetch all items into an array
    var items = [];
    
    for (var key of Object.keys(getItemList().item)) {
        
        var itm = getItemList().item[key];
        
        var needsSkipping = false;
        
        //check each version
        for (var index = RELEASE_VERSION.length-1; index >= 0; index--) {
            
            if (`${RELEASE_VERSION[index]}` === version) {
                var singleItem = itm[`${RELEASE_VERSION[index]}`]; 

                if (Object.keys(singleItem).length == 0) {
                    continue;
                }
                
                //latest object
                for (var rIndex = index-1;rIndex >= 0; rIndex--) {
                    let prevItem = itm[`${RELEASE_VERSION[rIndex]}`]; 
                    if (prevItem.hasOwnProperty('name')) {
                        singleItem["old"] = prevItem;
                        break;
                    }
                }
                
                items.push(singleItem);
                break;
            }
        }
    }
    
    return items;
}

const countItems = function() {
    
    //fetch all items into an array
    var items = {};
    var totalNumber = 0;
    
    
    for (let k of Object.keys(getItemList().category)) {
        let catKey = getItemList().category[k];
        items[catKey] = 1;
    }
    
    for (var key of Object.keys(getItemList().item)) {
        
        var itm = getItemList().item[key];
        
        var needsSkipping = false;
        
        //check each version
        for (var index = RELEASE_VERSION.length-1; index >= 0; index--) {
            
            var singleItem = itm[`${RELEASE_VERSION[index]}`]; 

            if (Object.keys(singleItem).length == 0) {
                continue;
            }
        
            //found item
            for (let cat of singleItem.category) {
                let catKey = getItemList().category[cat];
                items[catKey] = items[catKey] + 1;
            }
            totalNumber = totalNumber + 1;
            break;
        }
    }
    return {"items":items,"total":totalNumber};
}

// initialize url for points json
const prepUrl = function(url) {
    ItemDescriptionManager.getInstance().initURL(url);
}

// export
module.exports = {
    getCategories: categoryList,
    getTierList: tierList,
    getItems:list,
    getUpdatedItems: updatedList,
    getItem:singleItemCode,
    getItemByName: singleItem,
    getItemNumber: countItems,
    initURL: prepUrl
};
