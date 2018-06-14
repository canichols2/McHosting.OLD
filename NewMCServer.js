var io               = require("./singleton").io
var serversDB        = require("./database.js").serversDB
var hostSettingsDB   = require("./database.js").hostSettingsDB
var inspect          = require("./common").inspect;
var getSetting       = require("./common").getSetting;
var fs               = require('fs-extra')

function updateServerInDB(server){
   return new Promise((resolve, reject) => {
       serversDB.update({_id:server._id},server,{upsert:true},(err,numReplaced,upsert)=>{
         if(err){return reject("Server was unable to be updated:",server)}
         console.log("records updated:",numReplaced)
         console.log("server updated:",upsert)
         return resolve(server)
       })
   });
}

function addServerToDB(server) {
   return new Promise((resolve, reject) => {
      console.log("addServerToDB")
      serversDB.find({"name":server.name},(err,docs)=>{
         if(err || docs.length == 0){
            console.log("FindServer error:",err)
            // return reject(err)
            serversDB.insert(server,(err,newDoc)=>{
               if(err){return reject("Server was unable to be added:",server)}
               return resolve(newDoc);
            })
         }else{
            console.log("FindServer response:",docs)
            return reject("Server Already Exists");
         }
      })
   });
}
function ensureServerDir(server) {
   return new Promise((resolve, reject) => {
      console.log("ensureServerDir")
      getSetting("serversDir")
      .then((dir)=>{
         console.log("serversDir is:",dir)
         server.cwd = dir+"servers/"+server.name+"/"
         fs.ensureDir(server.cwd)
         .then(()=>{
            console.log("server.cwd:",server.cwd)
            updateServerInDB(server)
            .then(()=>{
               return resolve(server);
            })
         })
      })
      
   });
}
function ensureServerFile(server) {
   return new Promise((resolve, reject) => {
      console.log("ensureServerFile")
      return resolve(server);
   });
}
function createSymlinkToServer(server) {
   return new Promise((resolve, reject) => {
      console.log("createSymlinkToServer")
      return resolve(server);
   });
}
function createEULA(server) {
   return new Promise((resolve, reject) => {
      console.log("createEULA")
      return resolve(server);
   });
}
function createServerProp(server) {
   return new Promise((resolve, reject) => {
      console.log("createServerProp")
      return resolve(server);
   });
}


module.exports= function (server) {
   let promise = Promise.resolve(server)
   //Add server to DB
      .then(addServerToDB)
      .then(inspect)
   //ensure server directory is created
      .then(ensureServerDir)
      .then(inspect)
   //ensure server file is downloaded
      .then(ensureServerFile)
   //create symlink
      .then(createSymlinkToServer)
   //create EULA
      .then(createEULA)
   //create server.properties
      .then(createServerProp)
      .then(inspect)
   //
   return promise
}