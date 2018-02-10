// vainglory-req.js
// ================

//dependency
var request = require( 'request' );
var fs = require ( 'fs' );

// constant
const VG_URL = 'https://api.dc01.gamelockerapp.com/shards/'
//const VG_URL = 'http://192.168.178.22:8080/'

// request token for VG API
var requestToken = '';

var playerStats = function (device, region, player, rawDate, callback) {

	//check for non-empty VG key
    var key = requestToken;
	if (key==null || key == '') {
		console.log("Error: API Key is empty");
		return null;
	}

	var since_date = getTimeStamp(rawDate);
   
	console.log("Requesting "+player+" ...");
  
	var requestURL = VG_URL + region + "/matches?filter[createdAt-start]="+since_date+"&filter[playerNames]="+player;
  console.log(requestURL);
	var reqOption = {
		url: requestURL,
		headers: {
			'User-Agent':'request',
			'Authorization': key,
			'X-TITLE-ID': 'semc-vainglory',
			'Accept': 'application/json',
			'Cache-Control': 'private, no-cache, no-store, must-revalidate',
			'Expires': '-1',
			'Pragma': 'no-cache'
		}
	};
	request(reqOption,function (error, response, body){
		
	  if (!error && response.statusCode == 200) {
	    var json = JSON.parse(body);
      
      var ownPlayerID = "";
      //fetch own player id
      if (player.indexOf(',') == -1) {
        //only for single player info
        ownPlayerID = fetchPlayerID(json, player)
        // console.log(ownPlayerID);
        // console.log(player);
      }
      
			var totalCountGames = json.data.length;
			
			var month = (rawDate.getMonth()+1);
			
			var match = fetchLastMatch(json)
			
			var text = player + ": " + getFormattedDate(match.createdAt) + "\n";
      
      text = text + match.gameMode + ": "+ (match.duration-(match.duration%60))/60+"mins \n";

      // Helper list with all players grouped by roster
			var rosterLeft = [];
      var rosterRight = [];
      
      var maxScorePlayerValue = 0;
      var maxScorePlayerID = "";

			for (var rosterID of match.roster) {
				//text = text + "\n";
				var roster = fetchRoster(json,rosterID);

        if (roster.won == "true" && roster.side == 'left/blue') {
          text = text + "Left win \n";
        } else if (roster.won == "true"){
          text = text + "Right win \n";
        }
        
				//text = text + ""+roster.side+":" + "\n";
				for (var part of roster.participants) {
					var p = fetchParticipants(json, part);
          
          var mom = calculateManOfMatch(p);
          
          if (maxScorePlayerValue<mom) {
            maxScorePlayerValue = mom;
            maxScorePlayerID = p.playerID;
          }
        
          if (roster.side == 'left/blue') {
            rosterLeft.push(p);
          } else if (roster.side == 'right/red'){
            rosterRight.push(p);
          }
          
				}
			}
      
      // prepare output
      text = text + "\nLeft:\n";
      
      //left
      for (var p of rosterLeft) {
        
        const player = fetchPlayer(json,p.playerID);
        
        if (p.playerID == ownPlayerID) {
          text = text + "- " + p.actor + " / "+ player.name + " [" + player.guildTag  + "] ("+p.tier +")";
        } else {
          text = text + "- " + p.actor +  " / "+ player.name + " [" + player.guildTag + "] ("+p.tier +")";
        }
        
        if (maxScorePlayerID == p.playerID) {
          text = text + " *";
        }
        
        text = text + "\n";
      }
      
      text = text + "\nRight:\n";
      
      //right
      for (var p of rosterRight) {
        
        const player = fetchPlayer(json,p.playerID);
        
        if (p.playerID == ownPlayerID) {
          text = text + "- " + p.actor +" / "+ player.name + " [" + player.guildTag +  "] ("+p.tier +")";
        } else {
          text = text + "- " + p.actor +" / "+ player.name + " [" + player.guildTag +  "] ("+p.tier +")";
        }
        if (maxScorePlayerID == p.playerID) {
          text = text + " *";
        }
        
        text = text + "\n";
      }
      
			callback(text, match.id,match.createdAt, ""+ device + region + player, device);
	  } else {

		if(response != null) {
			console.log("# # # # #");
			console.log("URL: "+requestURL);
			console.log("Status: "+response.statusCode);
			console.log("Header: "+response.rawHeaders);
			console.log("Body: "+body);
	    console.log("Failed: "+error);
		}
		callback(null);
	  }
	});
}

// function for getting latest match
function fetchLastMatch(json) {
	
	var latestMatch = null;

	for (var game of json.data) {
		
		//fetch game information
		var attributes = game.attributes;

		if (latestMatch==null) {
			latestMatch = prepareMatchContent(game);
		} else {
			// check whether we already got the latest match
			if (latestMatch.createdAt < attributes.createdAt) {
				latestMatch = prepareMatchContent(game);
			}
		}
	}
	return latestMatch;
}

function prepareMatchContent(game) {
	
	var roster1 = game.relationships.rosters.data[0];
    var roster2 = game.relationships.rosters.data[1];

	var gameInfo = {
		"id": game.id,
		"createdAt": game.attributes.createdAt,
		"duration": game.attributes.duration,
		"gameMode":game.attributes.gameMode,
		"queue":game.attributes.stats.queue,
		"roster":[roster1.id,roster2.id]
	};
	return gameInfo;
}


// function to fetch all objects for given ID
function fetchRoster(json, rosterID) {
	
	var roster = null;
	

	for (var included of json.included) {

		// fetch item attributes
		var attributes = included.attributes;
	
		if ('roster' == included.type) {
			if (rosterID == included.id) {
			var list = [];

			for (var p of included.relationships.participants.data) {
				list.push(p.id);
			}
			
			roster = {
				"id": included.id,
				"side": attributes.stats.side,
				"participants": list,
        "won":attributes.won
			};
			}
		}
	}
	return roster;
}

//function to fetch all participants for given ID
function fetchParticipants(json, participantID) {
	
	var participant = null;
	
	for (var included of json.included) {

		// fetch item attributes
		var attributes = included.attributes;
	
		if ('participant' == included.type) {
			if (participantID == included.id) {
			
			var actor = attributes.actor;
			
			participant = {
				"id": included.id,
				"actor": actor.replace('\*','').replace('\*',''),
				"tier": getTier(attributes.stats.skillTier),
        "playerID":included.relationships.player.data.id,
        "kills":attributes.stats.kills,
        "deaths": attributes.stats.deaths,
        "assists": attributes.stats.assists,
        "krakenCaptures": attributes.stats.krakenCaptures,
        "turretCaptures": attributes.stats.turretCaptures,
        "minionKills": attributes.stats.minionKills,
        "goldMineCaptures": attributes.stats.goldMineCaptures,
        "crystalMineCaptures": attributes.stats.crystalMineCaptures
			};
			}
		}
	}
	return participant;
}

function fetchPlayerID(json, playerName) {
	
	for (var included of json.included) {

		// fetch item attributes
		var attributes = included.attributes;
	
		if ('player' == included.type) {
			if (playerName == attributes.name) {
			  return included.id;
			}
		}
	}
	return null;
}

function fetchPlayer(json, playerId) {
	
	for (var included of json.included) {
		// fetch item attributes
		var attributes = included.attributes;
	
		if ('player' == included.type) {
			if (playerId == included.id) {
  			var player = {
  				"id": included.id,
  				"name": attributes.name,
  				"skillTier": getTier(attributes.stats.skillTier),
          "rankPoints": attributes.stats.rankPoints.ranked.toFixed(2),
          "guildTag":attributes.stats.guildTag,
  			};
        
			  return player;
			}
		}
	}
	return null;
}


// function for parsing relevant game data
function fetchVictoryGames(json) {
	
	//result
	var result = null;
	
	var gameList = json.data;
	
	for (var game of gameList) {
		
		//fetch game information
		var attributes = game.attributes;
		var gameInfo = {
			"id": game.id,
			"createdAt": attributes.createdAt,
			"duration": attributes.duration,
			"gameMode":attributes.gameMode,
			"queue":attributes.stats.queue
		};
		
		//console.log(gameInfo);
		result = gameInfo;
	}
	return result;
}

function countGameTypes(gameList, type) {
	var count = 0;
	
	for (var game of gameList) {
		if (game.gameMode === type) {
			count = count + 1;
		}
	}
	return count;
}

function calculateManOfMatch(details) {

  var sumKills = details.kills * 300;
        
  var sumDeaths = details.deaths * 300;
        
  var sumAssists = details.assists * 300;
        
  var sumKraken = details.krakenCaptures * 500;
        
  var sumTurret = details.turretCaptures * 300;
        
  var sumMinion = details.minionKills * 10;
        
  var sumGoldMiner = details.goldMineCaptures * 400;
        
  var sumCrystalMiner = details.crystalMineCaptures + 300;
        
  return sumKills - sumDeaths + sumAssists + sumKraken + sumTurret + sumMinion + sumGoldMiner + sumCrystalMiner;
}

function getTier(skillTier) {
	switch(skillTier) {
	case -1:
		return "T0";
	case 0:
		return "T1B";
	case 1:
		return "T1S";
	case 2:
		return "T1G";
	case 3:
		return "T2B";
	case 4:
		return "T2S";
	case 5:
		return "T2G";
	case 6:
		return "T3B";
	case 7:
		return "T3S";
	case 8:
		return "T3G";
	case 9:
		return "T4B";
	case 10:
		return "T4S";
	case 11:
		return "T4G";
	case 12:
		return "T5B";
	case 13:
		return "T5S";
	case 14:
		return "T5G";
	case 15:
		return "T6B";
	case 16:
		return "T6S";
	case 17:
		return "T6G";
	case 18:
		return "T7B";
	case 19:
		return "T7S";
	case 20:
		return "T7G";
	case 21:
		return "T8B";
	case 22:
		return "T8S";
	case 23:
		return "T8G";
	case 24:
		return "T9B";
	case 25:
		return "T9S";
	case 26:
		return "T9G";
	case 27:
		return "T10B";
	case 28:
		return "T10S";
	case 29:
		return "T10G";
	default:
		return "?";
	}
}


// function to get formatted time stamp
function getTimeStamp(date) {
	var month = (date.getMonth() < 9 )? "0"+(date.getMonth()+1):(date.getMonth()+1);
	var day = ((date.getDate()-1) < 10) ? "0"+(date.getDate()-1):(date.getDate());
	return ""+date.getFullYear() + "-" + month + "-" + day + "T00:00:00Z";
}

function getFormattedDate(date) {
	return date.replace("T","\n").replace("Z","");
}

var updateToken = function(token) {
  requestToken = token;
}

module.exports = {
	getPlayerStats: playerStats,
  setToken: updateToken
};