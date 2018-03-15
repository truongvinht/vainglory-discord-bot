// accessRightManager.js
// Handle user rights
// ================

//import
const c = require("../general/constLoader");

var AccessRightManager = (function () {
    var instance;
    
    function initInstance() {
        var map = {};
        
        return {
            addAccessRight: function(nameId,name) {
                
                if (nameId != null) {
                    map[nameId] = name;
                }
                return;
            },
            removeAccessRight: function(nameId) {
                delete map[nameId];
                return;
            },
            accessRights: function() {
                return Object.keys(map);
            },
            hasAccessRight: function(nameId) {
                return map[nameId]!=null;
            }
        }
    }
    return {
        getInstance: function() {
            if (!instance) {
                instance = initInstance();
            }
            return instance;
        } 
    };
})();

const addAccessRight = function(nameId,name) {
    AccessRightManager.getInstance().addAccessRight(nameId,name);
}

const removeAccessRight = function(nameId) {
    AccessRightManager.getInstance().removeAccessRightnameId;
}

const list = function() {
    AccessRightManager.getInstance().accessRights();
}

const hasAccess = function(nameId) {
    AccessRightManager.getInstance().hasAccessRight(nameId);
}


//check whether triggered user has special rights
const userHasPermissionForChannel = function(channel, userName) {
    for(var guildMember of channel.members.array()) {
        
        if (userName === guildMember.user.username) {
            
            // user has permission
            var permission = false;
            
            for (var reqRole of c.restriction()) {
                if (guildMember.roles.find("name", reqRole)) {
                    return true;
                }
            }
        }
    }
    return false;
}

// export
module.exports = {
    addAccess: addAccessRight,
    removeAccess: removeAccessRight,
    accessRights: list,
    hasAccess: hasAccess,
    hasAccess: userHasPermissionForChannel
};