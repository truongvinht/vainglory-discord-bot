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
    var d = new Discord.RichEmbed()
        .setAuthor(message.author.username);
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
                .setFooter(`${categoryMap.items[category-1]} => ${PREFIX}item ${category} [INDEX]`));
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
                        .setFooter(`${categoryMap.items[category-1]} | ${tierMap.items[tier-1]} => ${PREFIX}item ${category} ${tier} [INDEX]`));

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


// export
module.exports = {
    showItem: showItem
};