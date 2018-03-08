// itemHandler.js
// Handle items for heroes
// ==================


// import 
const itemList = require("../data/items.json");
const i18n = require('./langSupport');
var log = require('loglevel');

const TIER_LIST = ['Tier 1','Tier 2','Tier 3'];

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
        
        //check tier first
        if (itm.tier!=parseInt(tier)) {
            continue;
        }
        
        //check category with a for loop
        for (var ctg of itm.category) {
            if (ctg == category) {
                items.push(itm);
                break;
            }
        }
    }
    
    // list for output
    var list = "";
    
    for (var i of items) {
        list = list + "[" + `${items.indexOf(i)+1}` + "] " + i.name + "\n";
    }
    
    return {"title":`${i18n.get('ListOfMatchingItems')}`,"content":list,"items":items};
}

// export
module.exports = {
    getCategories: categoryList,
    getTierList: tierList,
    getItems:list
};
