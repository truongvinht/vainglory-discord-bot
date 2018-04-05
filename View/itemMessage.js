// itemMessage.js
// item messages
// ================

//import
const Discord = require("discord.js");

const c = require("../general/constLoader");
const i18n = require('../general/langSupport');

// CONTROLLER
const item = require('../controllers/itemHandler');

const showItem = (PREFIX, message) => {

    let messageArray = message.content.split(" ");
    showItemWithParam(PREFIX,message,messageArray);

}

const showItemWithParam = (PREFIX, message, messageArray) => {
    var d = new Discord.RichEmbed().setAuthor(message.author.username);
    if (messageArray.length == 1) {
        let categoryMap = item.getCategories();
        message.channel.send(d.addField(categoryMap.title, categoryMap.content)
        .setFooter(`=> ${PREFIX}item [INDEX]`));
    } else if (messageArray.length == 2) {
        // ITEM + CATEGORY
        const category = messageArray[1];

        let categoryMap = item.getCategories();
        if (!isNaN(category)) {
            if (category>0&&category<=categoryMap.count) {
                //TIER SELECTION
                let tierMap = item.getTierList();
            
                message.channel.send(d.addField(tierMap.title, tierMap.content)
                .setFooter(`${categoryMap.items[category-1]}`));
            } else {
                d = d.setDescription(`${i18n.get('InvalidInput')}`);
                message.channel.send(d.addField(categoryMap.title, categoryMap.content));
            }
        } else {
            message.channel.send(d.setDescription(`${i18n.get('InvalidInput')}`));
        }
    } else if (messageArray.length == 3) {
        // ITEM + CATEGORY + TIER
        const category = messageArray[1];

        let categoryMap = item.getCategories();
        if (!isNaN(category)) {
            if (category>0&&category<=categoryMap.count) {
            
                const tier = messageArray[2];
                let tierMap = item.getTierList();
            
                if (!isNaN(tier)) {
                
                    if (tier>0&&tier<=tierMap.count) {
                        // show items for category and tier
                        const list = item.getItems(category,tier);
                        message.channel.send(d.addField(list.title, list.content)
                        .setFooter(`${categoryMap.items[category-1]} | ${tierMap.items[tier-1]}`));

                    } else {
                        d = d.setDescription(`${i18n.get('InvalidInput')}`);
                        message.channel.send(d.addField(tierMap.title, tierMap.content));
                    }
                } else {
                    message.channel.send(d.setDescription(`${i18n.get('InvalidInput')}`));
                }
            } else {
                d = d.setDescription(`${i18n.get('InvalidInput')}`);
                message.channel.send(d.addField(categoryMap.title, categoryMap.content));
            }
        } else {
            message.channel.send(d.setDescription(`${i18n.get('InvalidInput')}`));
        }
    } else  if (messageArray.length == 4) {
        // ITEM + CATEGORY + TIER
        const category = messageArray[1];

        let categoryMap = item.getCategories();
        if (!isNaN(category)) {
            if (category>0&&category<=categoryMap.count) {
            
                const tier = messageArray[2];
                let tierMap = item.getTierList();

                if (!isNaN(tier)) {
                    if (tier>0&&tier<=tierMap.count) {
                        // show items for category and tier
                        const itemList = item.getItems(category,tier);
                        let selectedIndex = messageArray[3];
                    
                        if (!isNaN(selectedIndex)) {
                    
                            if (selectedIndex>0&&selectedIndex<=itemList.items.length) {
                                let selectedItem = itemList.items[selectedIndex-1];
                            
                                var dependency = "";
                            
                                if (selectedItem.hasOwnProperty("depending")) {
                                
                                    var depend = "";
                                
                                    for (var de of selectedItem.depending) {
                                    
                                        if (depend == "") {
                                            depend = de;
                                        } else {
                                            depend = depend +", " + de;
                                        }
                                    }
                                
                                    dependency = `| ${i18n.get('Dependency')}: ${depend}`;
                                }
                                if (selectedItem.hasOwnProperty("image")) {
                                    d = d.setThumbnail(`${c.itemURL()}/${selectedItem.image}.png`);
                                }
                        
                                d = d.setTitle(selectedItem.name)
                                    .setDescription(`${i18n.get('Gold')}: ${selectedItem.price} ${dependency}`)
                                    .addField('\u200B',`${selectedItem.description}`)
                                    .setFooter(`${categoryMap.items[category-1]} | ${tierMap.items[tier-1]}`);
                                
                                    if (selectedItem.hasOwnProperty('old')) {
                                        let oldItem = selectedItem.old;
                                        d = d.addField(`${i18n.get('PrioUpdate')}:`,`${i18n.get('Gold')}: ${oldItem.price} ${dependency}`)
                                        .addField('\u200B',`${oldItem.description}`)
                                    } 
                            message.channel.send(d);
                            } else {
                                d = d.setDescription(`${i18n.get('InvalidInput')}`);
                                message.channel.send(d.addField(itemList.title, itemList.items.length));
                            }
                        } else {
                            message.channel.send(d.setDescription(`${i18n.get('InvalidInput')}`));
                        }
                    } else {
                        d = d.setDescription(`${i18n.get('InvalidInput')}`);
                        message.channel.send(d.addField(tierMap.title, tierMap.content));
                    }
            } else {
                message.channel.send(d.setDescription(`${i18n.get('InvalidInput')}`));
            }
            } else {
                d = d.setDescription(`${i18n.get('InvalidInput')}`);
                message.channel.send(d.addField(categoryMap.title, categoryMap.content));
            }
        } else {
            message.channel.send(d.setDescription(`${i18n.get('InvalidInput')}`));
        }
    } else {
        message.channel.send(d.setDescription(`${i18n.get('InvalidInput')}`));
    }
}

const showSingleItem = (message) => {

    let messageArray = message.content.split(" ");
    var d = new Discord.RichEmbed()
        .setAuthor(message.author.username);
    
    if (messageArray.length == 2) {
    
        let selectedItem = item.getItem(messageArray[1]);
        
        if (selectedItem === null) {
            d = d.setDescription(`${i18n.get('InvalidInput')}`);
            message.channel.send(d.addField(`${messageArray[1]}`,'\u200B'));
        } else {
            var dependency = "";
            
            if (selectedItem.hasOwnProperty("depending")) {
                
                var depend = "";
                
                for (var de of selectedItem.depending) {
                    
                    if (depend == "") {
                        depend = de;
                    } else {
                        depend = depend +", " + de;
                    }
                }
                
                dependency = `| ${i18n.get('Dependency')}: ${depend}`;
            }
            if (selectedItem.hasOwnProperty("image")) {
                d = d.setThumbnail(`${c.itemURL()}/${selectedItem.image}.png`);
            }
            
            let cMap = item.getCategories();
            let tierMap = item.getTierList();
            
            d = d.setTitle(selectedItem.name)
                .setDescription(`${i18n.get('Gold')}: ${selectedItem.price} ${dependency}`)
                .addField('\u200B',`${selectedItem.description}`)
                .setFooter(`${cMap.items[parseInt(selectedItem.category[0])-1]} | ${tierMap.items[parseInt(selectedItem.tier)-1]}`);
                
            if (selectedItem.hasOwnProperty('old')) {
                let oldItem = selectedItem.old;
                d = d.addField(`${i18n.get('PrioUpdate')}:`,`${i18n.get('Gold')}: ${oldItem.price} ${dependency}`)
                .addField('\u200B',`${oldItem.description}`)
            } 
            message.channel.send(d);
        }
    } else {
        message.channel.send(d.setDescription(`${i18n.get('InvalidInput')}`));
    }
}


const updatedItems = (version, message) => {
    
    if (isNaN(version)) {
        var d = new Discord.RichEmbed()
        .setAuthor(message.author.username);
        
        message.channel.send(d.setDescription(`${i18n.get('InvalidInput')}`));
        return;
    }
    
    //restrict to all items
    if (parseFloat(version) < 3.1 ) {
        var d = new Discord.RichEmbed()
        .setAuthor(message.author.username);

        message.channel.send(d.setDescription(`${i18n.get('InvalidInput')}`));
        return;
    }

    message.channel.startTyping();
    let list = item.getUpdatedItems(version);
    
    
    //check list
    if (list.length == 0) {
        var d = new Discord.RichEmbed()
        .setAuthor(message.author.username);

        message.channel.send(d.setDescription(`${i18n.get('InvalidInput')}`));
        return;
    }
    
    let categoryMap = item.getCategories();
    let tierMap = item.getTierList();
    
    for (var selectedItem of list) {

        var d = new Discord.RichEmbed()
        .setAuthor(message.author.username);
        var dependency = "";
        
        if (selectedItem.hasOwnProperty("depending")) {
            
            var depend = "";
            
            for (var de of selectedItem.depending) {
                
                if (depend == "") {
                    depend = de;
                } else {
                    depend = depend +", " + de;
                }
            }
            
            dependency = `| ${i18n.get('Dependency')}: ${depend}`;
        }
        if (selectedItem.hasOwnProperty("image")) {
            d = d.setThumbnail(`${c.itemURL()}/${selectedItem.image}.png`);
        }
    
        d = d.setTitle(selectedItem.name)
            .setDescription(`${i18n.get('Gold')}: ${selectedItem.price} ${dependency}`)
            .addField('\u200B',`${selectedItem.description}`)
            .setFooter(`${categoryMap.items[selectedItem.category[0]-1]} | ${tierMap.items[selectedItem.tier-1]}`);
            
        if (selectedItem.hasOwnProperty('old')) {
            let oldItem = selectedItem.old;
            d = d.addField(`${i18n.get('PrioUpdate')}:`,`${i18n.get('Gold')}: ${oldItem.price} ${dependency}`)
            .addField('\u200B',`${oldItem.description}`)
        } 
        message.channel.send(d);
    }
    message.channel.stopTyping();
}

const countItems = () => {

    message.channel.startTyping();
    console.log(item.getItemNumber());
    message.channel.stopTyping();
}

// export
module.exports = {
    showItem: showItem,
    showItemWithParam:showItemWithParam,
    showSingleItem:showSingleItem,
    showUpdatedItems:updatedItems,
    showItemsNumber: countItems
};