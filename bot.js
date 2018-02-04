const botSettings = require("./botsettings.json");
const Discord = require("discord.js");
const mobaCounter = require("./mobaCounter.json");

const bot = new Discord.Client({disableEveryone: true});

//counter picker
const cp = require('./vgCounterPicker');

bot.on("ready", async () => {
  console.log(`Bot is ready! ${bot.user.username}`);
  
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
    .setDescription("Following commands are available:")
    .addField(`${botSettings.prefix}counter HERO`,"Displays the weakness of given hero")
    .addField(`${botSettings.prefix}c HERO-CODE`,"Quick Display weakness of given hero code")
    .addField(`${botSettings.prefix}support HERO`,"Displays the strength of hero")
    .addField(`${botSettings.prefix}s HERO-CODE`,"Quick Display strength of given hero code")
    .addField(`${botSettings.prefix}g HERO-CODE`,"Quick Display strength/weakness of given hero code")
    .addField(`${botSettings.prefix}hero`,"Display list of available heroes");
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
          d = d.addField(`${heroName} is weak against`,result).addField(`${heroName} is strong against`,resultSupport);
          message.channel.send(d);
        } else {
          message.channel.send(d.setDescription(`Hero '${heroName}' not found!`))
        }
      } else {
        message.channel.send(d.setDescription(`Hero '${heroName}' not found!`))
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
        message.channel.send(d.addField(`${hero} is weak against`,result));
      } else {
        message.channel.send(d.setDescription(`Hero '${hero}' not found!`))
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
          message.channel.send(d.addField(`${heroName} is weak against`,result));
        } else {
          message.channel.send(d.setDescription(`Hero '${heroName}' not found!`))
        }
      } else {
          message.channel.send(new Discord.RichEmbed()
            .setAuthor(message.author.username)
            .setDescription(`'${heroName}': Invalid hero code!`));
      }
    }

    // support pick
    if (command === `${botSettings.prefix}support`) {
      
      var d = new Discord.RichEmbed()
      .setAuthor(message.author.username)
      .setColor("#008000");

      let result = cp.getSupport(hero);
      
      if (result != null) {
        message.channel.send(d.addField(`${hero} is strong against`,result));
      } else {
        message.channel.send(d.setDescription(`Hero '${hero}' not found!`))
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
          message.channel.send(d.addField(`${heroName} is weak against`,result));
        } else {
          message.channel.send(d.setDescription(`Hero '${heroName}' not found!`))
        }
      } else {
          message.channel.send(new Discord.RichEmbed()
            .setAuthor(message.author.username)
            .setDescription(`'${heroName}': Invalid hero code!`));
      }
    }

    // quick general information
    if (command.toLowerCase() === `${botSettings.prefix}g` ) {
      
      var d = new Discord.RichEmbed()
      .setAuthor(message.author.username)
      .setColor("#123456");
      
      //hero quick name
      let hName = messageArray[1].toLowerCase();
      let heroName = cp.getHeroName(hName);
      
      if (heroName != null) {
        let result = cp.getCounter(heroName.toLowerCase());
        let resultSupport = cp.getSupport(heroName.toLowerCase());
      
        if (result != null) {
          
          d = d.addField(`${heroName} is weak against`,result).addField(`${heroName} is strong against`,resultSupport);
          message.channel.send(d);
        } else {
          message.channel.send(d.setDescription(`Hero '${heroName}' not found!`))
        }
      } else {
          message.channel.send(new Discord.RichEmbed()
            .setAuthor(message.author.username)
            .setDescription(`'${heroName}': Invalid hero code!`));
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