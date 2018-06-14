
var Datastore = require('nedb')

var serversDB        = new Datastore({filename:"servers.db",autoload:true})

var hostSettingsDB   = new Datastore({filename:"settings.db",autoload:true})

//For Rerun ability
serversDB.remove({name:"temp"})

module.exports.serversDB = serversDB
module.exports.hostSettingsDB = hostSettingsDB