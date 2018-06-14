var io               = require("./singleton").io
var serversDB        = require("./database.js").serversDB
var hostSettingsDB   = require("./database.js").hostSettingsDB
var newMCServer      = require("./NewMCServer")

exports.newServer = function(server)
{
   console.log("McCommands server:",server)
   return newMCServer(server)
   .then(()=>{
      console.log("McCommands: after newMCServer")
   })
}