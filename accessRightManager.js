// accessRightManager.js
// Handle user rights
// ================


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

// export
module.exports = {
    addAccess: addAccessRight,
    removeAccess: removeAccessRight,
    accessRights: list,
    hasAccess: hasAccess
};