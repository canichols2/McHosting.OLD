var io               = require("./singleton").io
var serversDB        = require("./database.js").serversDB
var hostSettingsDB   = require("./database.js").hostSettingsDB
var newMCServer      = require("./NewMCServer").all
var writeServerProp  = require("./NewMCServer").createServerProp
var serverStatus     = require("./common").serverStatus;
var runningServers   = require('./runningServers')

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
exports.startServer = function startServer(server){
   new Promise((resolve, reject) => {
       
   });
}
exports.stopServer  = function stopServer(server){
   new Promise((resolve, reject) => {
       
   });
}
exports.deleteServer  = function(server){
   new Promise((resolve, reject) => {
       Promise.resolve(server)
       .then(stopServer)
       .then(()=>{/*Remove server files with extreme predjudice*/})
       .then(()=>{/*Remove server from DB*/})
       .then(()=>{/*Remove server from GUI*/})
   });
}