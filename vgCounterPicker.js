// vgCounterPicker.js
// Handle counter pick for given hero name
// ==================


// import 
const mobaCounter = require("./mobaCounter.json");


// weak against
var counter = function(hero) {
    
  //check for hero name
  if (mobaCounter.against.hasOwnProperty(hero)) {
  
    if (mobaCounter.against[hero].length > 0) {
      var list = "";
      
      for(var name of mobaCounter.against[hero]) {
        list = list + (`- ${name}`) + "\n";
      }
      return list;
    }
  } 
  
  // hero not found
  return null;
}

// strong against
var support = function(hero) {
  
  //check for hero name
  if (mobaCounter.with.hasOwnProperty(hero)) {
  
    if (mobaCounter.with[hero].length > 0) {
      var list = "";
      
      for(var name of mobaCounter.with[hero]) {
        list = list + (`+ ${name}`) + "\n";
      }
      
      return list;
    }
  } 
  // hero not found
  return null;
}

// hero list
var heroes = function() {
  
  // list for output
  var list = "";
  
  for (var key of Object.keys(mobaCounter.hero)) {
    list = list+ "+ " + mobaCounter.hero[key] + " [" + `${key}` + "]\n";
  }
  
  let content = {
    "title": `List of available heroes [${Object.keys(mobaCounter.hero).length}]`,
    "content": list
  }
  
  return content;
}

var quickHeroLookup = function(hero) {
  if (hero.length == 2) {
    if (mobaCounter.hero.hasOwnProperty(hero)) {
      return mobaCounter.hero[hero];
    }
  }else {
    return null;
  }
}

// export
module.exports = {
  getCounter: counter,
  getSupport: support, 
  getHeroes: heroes,
  getHeroName: quickHeroLookup
};