
const PORT = 8888
var  express = require("./singleton").express,
     app = require("./singleton").app,
     http = require("./singleton").http,
     server = require("./singleton").server,
     io = require("./singleton").io,
     request = require("./singleton").request,
     cheerio = require("./singleton").cheerio,
     fs = require("./singleton").fs
// var io = require('./singletons')
var serversDB        = require("./database.js").serversDB
var hostSettingsDB   = require("./database.js").hostSettingsDB
var serverStatus     = require("./common").serverStatus;
var  MC = require( "./McCommands")
var  AC = require( "./AdminCommands")
var serverSettings = [
   {key:"serversDir",value:"C:/opt/minecraft/"},
]
hostSettingsDB.count({},(err,count)=>{
   if(count == 0){
      hostSettingsDB.insert(serverSettings);
   }
})
if (process.platform == "win32") {   installDirParent = "C:/opt/minecraft/"} else {   installDirParent = "/opt/minecraft/"}



io.listen(server).on('connection',(socket)=>{
   serversDB.find({},(err,servers)=>{
      var data = {
         servers:servers
      }
      socket.emit('allServers',data)
   })
   
   socket.on('ServerAction' ,(Data)=>{
      console.log("ServerAction")
      switch (Data.action) {
         case "start":
            console.log("start")
            break;
         case "stop":
            console.log("stop")
            break;
         case "create":
            console.log("create:",Data.server)
            MC.newServer(Data.server)
            .catch((err)=>{
               console.log("Catch:",err)
               serversDB.find({},(err,docs)=>{
                  console.log("FindServer response: in app.js:",docs)
               })
            })
            break;
         case "remove":
            console.log("remove")
            break;
      
         default:
            socket.emit("message", `The action: ${Data.action} is not a valid action.`)
            break;
      }
   })
   socket.on('SettingsChange',(Data)=>{
      switch (Data.action) {
         case "start":
      
         default:
            socket.emit("message", `The action: ${Data.action} is not a valid action.`)
            break;
      }
})
   socket.on('AdminChange',()=>{})
   socket.on('blank',()=>{})
})
app.use(express.static('client'))
//Use materialize css files from node_modules directory
app.use('/materialize',express.static('./node_modules/materialize-css/dist'))

console.log("Listening for a connection...");
console.log("Access Web GUI at http://127.0.0.1:"+PORT);
server.listen(PORT)