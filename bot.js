const botSettings = require("./botsettings.json");
const Discord = require("discord.js");
const i18n = require('./langSupport');
var vg = require('./vainglory-req');

//counter picker
const cp = require('./vgCounterPicker');

const bot = new Discord.Client({disableEveryone: true});

//Image source
var imageURL = botSettings.imageURL;
if (imageURL == "") {
  // Heroku ENV token
  imageURL = process.env.IMAGE_URL;
}

bot.on("ready", async () => {
  
  console.log(`${i18n.get('BotReady')} ${bot.user.username}`);
  
  try {
    let link = await bot.generateInvite(["ADMINISTRATOR"]);
    console.log(link);
  }catch(e) {
    console.log(e.stack);
  }
});

bot.on("message", async message => {

  if(message.author.bot) return;

  if(!message.content.startsWith(botSettings.prefix)) return;
  
  //check for direct message
  if(message.channel.type === "dm") return;

  let messageArray = message.content.split(" ");
  let command = messageArray[0];
   
  var hasRole = false;
  
  for (var reqRole of botSettings.restricted) {
    if (message.member.roles.find("name", reqRole)) {
      hasRole = true;
      break;
    }
  }
  
  if (command === `${botSettings.prefix}help`) {
    let embed = new Discord.RichEmbed()
    .setAuthor(message.author.username)
    .setDescription(`${i18n.get('FollowingCommands')}`)
    .addField(`${botSettings.prefix}counter HERO`,`${i18n.get('DisplayWeaknessHero')}`)
    .addField(`${botSettings.prefix}c HERO-CODE`,`${i18n.get('DisplayWeaknessHeroCode')}`)
    .addField(`${botSettings.prefix}support HERO`,`${i18n.get('DisplayStrengthHero')}`)
    .addField(`${botSettings.prefix}s HERO-CODE`,`${i18n.get('DisplayStrengthHeroCode')}`)
    .addField(`${botSettings.prefix}HERO-CODE`,`${i18n.get('DisplayInfoHeroCode')}`)
    .addField(`${botSettings.prefix}hero`,`${i18n.get('DisplayListHero')}`);
    
    if(hasRole) {
      embed.addField(`${botSettings.prefix}match ${i18n.get('Player')} [server]`,`${i18n.get('LastMatchDetails')}`);
      embed.addField(`${botSettings.prefix}clear`,`${i18n.get('ClearCmd')}`);
    }
    
    message.channel.send(embed);
  }
  
  if (messageArray.length == 1) {
    //hero commands
    if (command.length == 3) {
      
      var d = new Discord.RichEmbed()
      .setAuthor(message.author.username)
      .setColor("#123456");
      
      let cmd = command.substring(1,3);
      
      //hero quick name
      let hName = cmd.toLowerCase();
      let heroName = cp.getHeroName(hName);
      
      let result = getGeneralInfo(heroName);
    
      if (heroName != null) {
        let result = cp.getCounter(heroName.toLowerCase());
        let resultSupport = cp.getSupport(heroName.toLowerCase());
  
        if (result != null) {
          d = d.setThumbnail(`${imageURL}/${heroName.toLowerCase()}.png`);
          d = d.addField(`${heroName} ${i18n.get('IsWeakAgainst')}`,result)
          .addField(`${heroName} ${i18n.get('IsStrongAgainst')}`,resultSupport);
          message.channel.send(d);
        } else {
          message.channel.send(d.setDescription(`'${heroName}': ${i18n.get('EnteredHeroDoesntExist')}`));
        }
      } else {
        message.channel.send(d.setDescription(`'${hName}': ${i18n.get('EnteredHeroDoesntExist')}`));
      }
    }
  }

  if (messageArray.length >= 2) {
    
    let hero = messageArray[1].toLowerCase();
    
    // counter pick
    if (command === `${botSettings.prefix}counter`) {
      
      var d = new Discord.RichEmbed()
      .setAuthor(message.author.username)
      .setColor("#ff0000");
      
      let result = cp.getCounter(hero);
      
      if (result != null) {
        d = d.setThumbnail(`${imageURL}/${hero.toLowerCase()}.png`);
        message.channel.send(d.addField(`${hero} ${i18n.get('IsWeakAgainst')}`,result));
      } else {
        message.channel.send(d.setDescription(`'${heroName}' ${i18n.get('NotFound')}`));
      }
    }

    // quick counter pick
    if (command.toLowerCase() === `${botSettings.prefix}c` ) {
      
      var d = new Discord.RichEmbed()
      .setAuthor(message.author.username)
      .setColor("#ff0000");
      
      //hero quick name
      let hName = messageArray[1].toLowerCase();
      
      let heroName = cp.getHeroName(hName);
      
      if (heroName != null) {
        
        let result = cp.getCounter(heroName.toLowerCase());
      
        if (result != null) {
          d = d.setThumbnail(`${imageURL}/${heroName.toLowerCase()}.png`);
          message.channel.send(d.addField(`${heroName} ${i18n.get('IsWeakAgainst')}`,result));
        } else {
          message.channel.send(d.setDescription(`'${heroName}' ${i18n.get('NotFound')}`));
        }
      } else {
          message.channel.send(new Discord.RichEmbed()
            .setAuthor(message.author.username)
            .setDescription(`'${heroName}': ${i18n.get('InvalidHeroCode')}`));
      }
    }

    // support pick
    if (command === `${botSettings.prefix}support`) {
      
      var d = new Discord.RichEmbed()
      .setAuthor(message.author.username)
      .setColor("#008000");

      let result = cp.getSupport(hero);
      
      if (result != null) {
        d = d.setThumbnail(`${imageURL}/${hero.toLowerCase()}.png`);
        message.channel.send(d.addField(`${hero} ${i18n.get('IsStrongAgainst')}`,result));
      } else {
        message.channel.send(d.setDescription(`'${heroName}' ${i18n.get('NotFound')}`))
      }
    }

    // quick support pick
    if (command.toLowerCase() === `${botSettings.prefix}s` ) {
      
      var d = new Discord.RichEmbed()
      .setAuthor(message.author.username)
      .setColor("#008000");
      
      //hero quick name
      let hName = messageArray[1].toLowerCase();
      let heroName = cp.getHeroName(hName);
      
      if (heroName != null) {
        let result = cp.getSupport(heroName.toLowerCase());
      
        if (result != null) {
        d = d.setThumbnail(`${imageURL}/${heroName.toLowerCase()}.png`);
          message.channel.send(d.addField(`${heroName} ${i18n.get('IsStrongAgainst')}`,result));
        } else {
          message.channel.send(d.setDescription(`'${heroName}' ${i18n.get('NotFound')}`));
        }
      } else {
          message.channel.send(new Discord.RichEmbed()
            .setAuthor(message.author.username)
            .setDescription(`'${heroName}': ${i18n.get('InvalidHeroCode')}`));
      }
    }

      
    //only allow users with roles
    if (command.toLowerCase() === `${botSettings.prefix}match` ) {

      if (hasRole){
        // restricted actions
        const playerName = messageArray[1];
        
        var serverCode = botSettings.vaingloryAPIServer;
        
        //override default server
        if (messageArray.length===3 && messageArray[2].length > 1 && messageArray[2].length < 4){
          serverCode = messageArray[2];
        }
        
        // prepare VG API token
        var vgToken = "";
        if (botSettings.vgAPIToken != "") {
          // use local TOKEN from settings
          vgToken = botSettings.vgAPIToken;
        } else {
          // Heroku ENV token
          vgToken = process.env.vgAPIToken;
        }

        var callback = function(text, matchID, matchDate, dbKey, device) {

          var d = new Discord.RichEmbed()
          .setAuthor(message.author.username)
          .setColor("#000000");
          
          if(text!=null) {
            message.channel.send(d.setDescription(`${text}`));
          }else {
          message.channel.send(d.setDescription(`'${matchID}' ${i18n.get('NotFound')}`));
          }
        };
        vg.setToken(vgToken);
        vg.getMatchStats("device",serverCode,playerName,new Date(), callback);
      }
    }
    
    //show player stats
    if (command.toLowerCase() === `${botSettings.prefix}player` ) {
      if (hasRole) {
        // restricted actions
        const playerName = messageArray[1];
        
        var serverCode = botSettings.vaingloryAPIServer;
        
        //override default server
        if (messageArray.length===3 && messageArray[2].length > 1 && messageArray[2].length < 4){
          serverCode = messageArray[2];
        }
        
        // prepare VG API token
        var vgToken = "";
        if (botSettings.vgAPIToken != "") {
          // use local TOKEN from settings
          vgToken = botSettings.vgAPIToken;
        } else {
          // Heroku ENV token
          vgToken = process.env.vgAPIToken;
        }

        var callback = function(playerName,player) {

          var d = new Discord.RichEmbed()
          .setColor("#FFD700");
          
          if(player!=null) {
            d = d.addField(`${player.name}`,`${i18n.get('Skilltier')}: ${player.skillTier}\n${i18n.get('guildTag')}: ${player.guildTag} \n${i18n.get('rankPoints')}: ${player.rankPoints} \n${i18n.get('level')}: ${player.level}`)
            message.channel.send(d);
          }else {
            message.channel.send(d.setDescription(`'${playerName}' ${i18n.get('NotFound')}`));
          }
        };
        vg.setToken(vgToken);
        vg.getPlayerStats(serverCode,playerName, callback);
      }
    }

  } else {
    // show heroes list
    if (command === `${botSettings.prefix}hero`) {
      
      var d = new Discord.RichEmbed()
      .setAuthor(message.author.username);
      
      let keyValueMap = cp.getHeroes();
      message.channel.send(d.addField(keyValueMap.title,keyValueMap.content));
    } else if (command === `${botSettings.prefix}clear` && hasRole) {
      async function clear() {
        //remove clear command (last 50 messages)
        message.delete();
      
        message.channel.fetchMessages({limit: 50}).then(messages => {
        
          for (const msg of messages.array()) {
             if (msg.author.id === bot.user.id) {
               msg.delete();
             } else {
               if (msg.content.startsWith(`${botSettings.prefix}`)) {
                 msg.delete();
               }
             }
          }
        }).catch(console.error);;
      }
      clear();
    }
  }
});


function getGeneralInfo(heroName) {
  
  if (heroName != null) {
    let result = cp.getCounter(heroName.toLowerCase());
    let resultSupport = cp.getSupport(heroName.toLowerCase());
  
    if (result != null) {
      return result;
    } else {
      return null;
    }
  } else {
    return null;
  }
}


if (botSettings.token != "") {
  // use local TOKEN from settings
  bot.login(botSettings.token);
} else {
  // Heroku ENV token
  bot.login(process.env.BOT_TOKEN);
}