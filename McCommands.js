var io               = require("./singleton").io
var serversDB        = require("./database.js").serversDB
var hostSettingsDB   = require("./database.js").hostSettingsDB
var newMCServer      = require("./NewMCServer").all
var writeServerProp  = require("./NewMCServer").createServerProp
var serverStatus     = require("./common").serverStatus;
var runningServers   = require('./runningServers')
var spawn            = require('./singleton').spawn
var sendStatusUpdate = require('./common').sendStatusUpdate
var sendLogUpdate    = require('./common').sendLogUpdate


var runningServers={}

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
       runningServers[server.name] = spawn('java',
      ['-jar',
       server.jar,
       'nogui',
       '-Xmx'+server.maxMem,
       '-Xms'+server.minMem],
      {cwd:server.cwd,
       stdio:['pipe','pipe','pipe']})
      sendStatusUpdate(server,"Online")
       runningServers[server.name].on('error',(data)=>{
          sendLogUpdate(server,data.toString())
          sendStatusUpdate(server,"Offline")
         //  serversDB
       })
       runningServers[server.name].stdout.on('data',(data)=>{
          sendLogUpdate(server,data.toString())
       })
       runningServers[server.name].stderr.on('data',(data)=>{
          sendLogUpdate(server,data.toString())
       })
   });
}
exports.stopServer  = function stopServer(server){
   new Promise((resolve, reject) => {
       var proc = runningServers[server.name]
       if(typeof proc != "undefined") 
       {
          proc.stdin.write("stop\n")
       }
       else{
          resolve(server)
       }
   });
}
exports.deleteServer  = function(server){
   new Promise((resolve, reject) => {
       var p = Promise.resolve(server)
       p.then(stopServer)
       p.then(()=>{
          /*Remove server files with extreme predjudice*/
      return fs.remove(server.cwd)})
       p.then(()=>{
          /*Remove server from DB*/
          serversDB.remove({_id:server._id})
      })
       p.then(()=>{
          /*Remove server from GUI*/
          io.emit('deleteServer',{server:server})
         })
       resolve()
   })
   .catch((err)=>{
      console.log("Something in deleteserver crashed",err)
   })
}