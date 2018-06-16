var io               = require("./singleton").io
var serversDB        = require("./database.js").serversDB
var hostSettingsDB   = require("./database.js").hostSettingsDB
var newMCServer      = require("./NewMCServer").all
var writeServerProp  = require("./NewMCServer").createServerProp
var serverStatus     = require("./common").serverStatus;

exports.newServer = function(server)
{
   console.log("McCommands server:",server)
   return newMCServer(server)
   .catch((err)=>{
      console.log("caught in McCommands.js",err)
   })
   .then(()=>{
      console.log("McCommands: after newMCServer")
   })
}