// itemHandler.js
// Handle items for heroes
// ==================


// import 
const c = require("../general/constLoader");

//item list
const itemList = require(`../data/items_${c.language()}.json`);
const i18n = require('../general/langSupport');
var log = require('loglevel');

const TIER_LIST = ['Tier 1','Tier 2','Tier 3'];
const RELEASE_VERSION = ['3.0','3.1'];

//FILTER LEVEL: CATEGORY TIER INDEX

const categoryList = function() {
    
    // list for output
    var list = "";
    var rawList = [];
    
    for (var key of Object.keys(itemList.category)) {
        list = list + "[" + `${key}` + "] " + itemList.category[key] + "\n";
        rawList.push(itemList.category[key]);
    }

    let content = {
        "title": `${i18n.get('ListAvailableCategories')} [${Object.keys(itemList.category).length}]`,
        "content": list,
        "count":Object.keys(itemList.category).length,
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
    
    for (var key of Object.keys(itemList.item)) {
        
        var itm = itemList.item[key];
        
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
        list = list + "[" + `${items.indexOf(i)+1}` + "] " + i.name + "\n";
    }
    
    return {"title":`${i18n.get('ListOfMatchingItems')}`,"content":list,"items":items};
}

const singleItemCode = function(code) {
    
    for (var key of Object.keys(itemList.item)) {
        
        var itm = itemList.item[key];
        
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
    
    for (var key of Object.keys(itemList.item)) {
        
        var itm = itemList.item[key];
        
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
    
    for (var key of Object.keys(itemList.item)) {
        
        var itm = itemList.item[key];
        
        var needsSkipping = false;
        
        //check each version
        for (var index = RELEASE_VERSION.length-1; index >= 0; index--) {
            
            
            if (`${RELEASE_VERSION[index]}` === version) {
                var singleItem = itm[`${RELEASE_VERSION[index]}`]; 

                if (Object.keys(singleItem).length == 0) {
                    continue;
                }
                
                //latest object
                if (index == RELEASE_VERSION.length-1) {
                    let prevItem = itm[`${RELEASE_VERSION[index-1]}`]; 
                    singleItem["old"] = prevItem;
                }
                
                items.push(singleItem);
                break;
            }
        }
    }
    
    return items;
}

// export
module.exports = {
    getCategories: categoryList,
    getTierList: tierList,
    getItems:list,
    getUpdatedItems: updatedList,
    getItem:singleItemCode,
    getItemByName: singleItem
};
