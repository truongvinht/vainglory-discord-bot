const botSettings = require("./botsettings.json");
const Discord = require("discord.js");
const mobaCounter = require("./mobaCounter.json");

const bot = new Discord.Client({disableEveryone: true});

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
    .addField("${botSettings.prefix}counter HERO","Displays the weakness of given hero")
    .addField("${botSettings.prefix}c HERO-CODE","Quick Display weakness of given hero code")
    .addField("${botSettings.prefix}support HERO","Displays the strength of hero")
    .addField("${botSettings.prefix}s HERO-CODE","Quick Display strength of given hero code")
    .addField("${botSettings.prefix}hero","Display list of available heroes");
    message.channel.send(embed);
  }
  
  if (messageArray.length >= 2) {
  
    // counter pick
    if (command === `${botSettings.prefix}counter`) {
      message.channel.send(counter(messageArray[1].toLowerCase(),message.author.username));
    }
    
    // quick counter pick
    if (command === `${botSettings.prefix}c`) {
      
      //hero quick name
      let hName = messageArray[1].toLowerCase();
      
      if (hName.length == 2) {
        if (mobaCounter.hero.hasOwnProperty(hName)) {
        
          let hero = mobaCounter.hero[hName];
        
          message.channel.send(counter(hero.toLowerCase(),message.author.username));
        } else {
          message.channel.send(new Discord.RichEmbed()
            .setAuthor(message.author.username)
            .setDescription(`'${hName}' not found!`));
        }
      } else {
          message.channel.send(new Discord.RichEmbed()
            .setAuthor(message.author.username)
            .setDescription(`'${hName}': Invalid hero code!`));
      }
    }
  
    // support pick
    if (command === `${botSettings.prefix}support`) {
      message.channel.send(support(messageArray[1].toLowerCase(),message.author.username));
    }
    
    
    // quick counter pick
    if (command === `${botSettings.prefix}s`) {
      
      //hero quick name
      let hName = messageArray[1].toLowerCase();
      
      if (hName.length == 2) {
        if (mobaCounter.hero.hasOwnProperty(hName)) {
        
          let hero = mobaCounter.hero[hName];
        
          message.channel.send(support(hero.toLowerCase(),message.author.username));
        } else {
          message.channel.send(new Discord.RichEmbed()
            .setAuthor(message.author.username)
            .setDescription(`'${hName}' not found!`));
        }
      } else {
          message.channel.send(new Discord.RichEmbed()
            .setAuthor(message.author.username)
            .setDescription(`'${hName}': Invalid hero code!`));
      }
    }
    
  } else {
    // show heroes list
    if (command === `${botSettings.prefix}hero`) {
      message.channel.send(heroList(message.author.username));
    }
  }
});

bot.login(botSettings.token);

// weak against
function counter(hero, username) {
  
  var d = new Discord.RichEmbed()
  .setAuthor(username)
  .setColor("#ff0000");
    
  //check for hero name
  if (mobaCounter.against.hasOwnProperty(hero)) {
  
    if (mobaCounter.against[hero].length > 0) {
      var list = "";
      
      for(var name of mobaCounter.against[hero]) {
        list = list + (`- ${name}`) + "\n";
      }
      
      d = d.addField(`${hero} is weak against`,list);
      return d;
    }
  } 
  // hero not found
  return new Discord.RichEmbed()
    .setAuthor(username)
    .setDescription(`Hero '${hero}' not found!`);
}

// strong against
function support(hero, username) {
  
  var d = new Discord.RichEmbed()
  .setAuthor(username)
  .setColor("#008000");
    
  //check for hero name
  if (mobaCounter.with.hasOwnProperty(hero)) {
  
    if (mobaCounter.with[hero].length > 0) {
      var list = "";
      
      for(var name of mobaCounter.with[hero]) {
        list = list + (`+ ${name}`) + "\n";
      }
      
      return d.addField(`${hero} is strong against`,list);
    }
  } 
  // hero not found
  return new Discord.RichEmbed()
    .setAuthor(username)
    .setDescription(`Hero '${hero}' not found!`);
}

// hero list
function heroList(username) {
  
  var d = new Discord.RichEmbed()
  .setAuthor(username);
  
  // list for output
  var list = "";
  
  
  for (var key of Object.keys(mobaCounter.hero)) {
    list = list+ "+ " + mobaCounter.hero[key] + " [" + `${key}` + "]\n";
  }
  
  return d.addField(`List of available heroes [${Object.keys(mobaCounter.hero).length}]`,list);
}