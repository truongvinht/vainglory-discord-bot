const botSettings = require("./botsettings.json");
const Discord = require("discord.js");
const i18n = require('./langSupport');

//counter picker
const cp = require('./vgCounterPicker');

const bot = new Discord.Client({disableEveryone: true});

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

  //check for direct message
  if(message.channel.type === "dm") return;

  if(!message.content.startsWith(botSettings.prefix)) return;

  let messageArray = message.content.split(" ");

  let command = messageArray[0];
  let args = messageArray.slice(1);

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
          d = d.addField(`${heroName} ${i18n.get('IsWeakAgainst')}`,result)
          .addField(`${heroName} ${i18n.get('IsStrongAgainst')}`,resultSupport);
          message.channel.send(d);
        } else {
          message.channel.send(d.setDescription(`'${heroName}' ${i18n.get('NotFound')}`));
        }
      } else {
        message.channel.send(d.setDescription(`'${heroName}' ${i18n.get('NotFound')}`));
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
        message.channel.send(d.addField(`${hero} ${i18n.get('IsStrongAgainst')}`,result));
      } else {
        message.channel.send(d.setDescription(`'${heroName}' ${i18n.get('NotFound')}`))
      }
    }

    // quick counter pick
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

  } else {
    // show heroes list
    if (command === `${botSettings.prefix}hero`) {
      
      var d = new Discord.RichEmbed()
      .setAuthor(message.author.username);
      
      let keyValueMap = cp.getHeroes();
      message.channel.send(d.addField(keyValueMap.title,keyValueMap.content));
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