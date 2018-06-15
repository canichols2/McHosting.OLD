var io               = require("./singleton").io
var serversDB        = require("./database.js").serversDB
var hostSettingsDB   = require("./database.js").hostSettingsDB
var inspect          = require("./common").inspect;
var getSetting       = require("./common").getSetting;
var serverStatus     = require("./common").serverStatus;
var fs               = require('fs-extra')
var download         = require('./download')
var spawn            = require('child_process').spawn

function sendStatusUpdate(server,message) {
   io.emit('statusUpdate',{
      server:server,
      message:message
   })
}



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
function ensureBuildTools(server){
   console.log("inside ensureBuildTools")
   console.log("Server:",server)
   return new Promise((resolve, reject) => {
      console.log("inside ensureBuildTools.Promise")
      fs.pathExists(server.binDir+server.type+"-"+server.shortVersion+".jar")
      .then((exists)=>{
         console.log("inside ensureBuildTools.Promise.fs.pathExists.then()")
         if(!exists){
            sendStatusUpdate(server,"Downloading BuildTools.jar")
            
               download.urlToFile(
                  "https://hub.spigotmc.org/jenkins/job/BuildTools/lastSuccessfulBuild/artifact/target/BuildTools.jar",
                  server.binDir,
                  "buildtools.jar",
                  (percent)=>{
                     server.status=serverStatus.downloading;
                     sendStatusUpdate(server,`Downloading BuildTools.jar: ${percent}`)
                  }
               )  
               .then(()=>{
                  sendStatusUpdate(server,"BuildTools.jar Done")
                  resolve(server)
               })
               .catch(reject)
         }
         else{
            sendStatusUpdate(server,"BuildTools.jar Done")
            resolve()
         }
      
      })
   })
}
function ensureBTserverjar(server) {
   var GenServerJars = spawn("java",
      ['-jar',"buildtools.jar","--rev",server.shortVersion],{
         cwd:server.binDir,
         stdio: ['pipe', 'pipe', 'pipe']
      })
      //////////////// Use if you want to display output back to user.
      //////////////// But don't console.log it.....
      // GenServerJars.stdout.on('data',(data)=>{
      //    console.log("downloading Spigot/craftbukkit file:",data.toString())
      // })
      // GenServerJars.stderr.on('data',(data)=>{
      //    console.log("downloading Spigot/craftbukkit file: ERROR:",data.toString())
      // })
      var p = new Promise((resolve, reject) => {
         sendStatusUpdate(server,"Downloading server.jar")
         GenServerJars.on('error',data=>{
            if(data.toString().includes("Could not get version"))
            return reject(data.toString())
         //TODO: if problem was locked file
         //remove locked files/and restart
            return reject(data.toString())
         })
         GenServerJars.on('exit',data=>{
         if(GenServerJars.exitCode == 0){
            server.status="server bin jar downloaded";
            server.binJar = server.type+"-"+server.shortVersion+".jar"
            resolve(server)}
         else{reject("not sure why spawn java broke:",data)}
       })
   });
   // return GenServerJars;
   return p;
}
exports.ensureBTServerJar = ensureBTserverjar

function ensureServerFile(server) {
   return new Promise((resolve, reject) => {
      console.log("ensureServerFile")

      server.status=serverStatus.downloading
      sendStatusUpdate(server,"Preparing server binary")
      
      switch (server.type) {
         case "vanilla":
            
            break;
         case "forge":
            
            break;
         case "spigot":
         case "craftbukkit":
         getSetting("serversDir")
            .then((dir)=>{server.binDir = dir+"bin/BuildTools/";return server;})
            .then(ensureBuildTools)
            .then(ensureBTserverjar)
            .then((server)=>{
               server.status=serverStatus.downloaded;
               sendStatusUpdate(server,"Binaries Downloaded")
               return server;
            })
            .then(resolve)
            break;
            
      
         default:
            break;
      }
   });
}
function createSymlinkToServer(server) {
   return new Promise((resolve, reject) => {
      console.log("createSymlinkToServer")
      fs.ensureSymlink(server.binDir+server.binJar,server.cwd+server.jar)
      .then(resolve)
      .catch((err)=>{
         return reject("Symlink not created for some reason:",err)
      })
      // return resolve(server);
   });
}
function createEULA(server) {
   return new Promise((resolve, reject) => {
      server.status=serverStatus.creatingSettings;
      sendStatusUpdate(server,"Accepting EULA")
      fs.writeFile(server.cwd+"eula.txt", "eula=true")
      .then(resolve)
      .catch(()=>{return reject("EULA not created")})
      // return resolve(server);
   });
}
function createServerProp(server) {
   return new Promise((resolve, reject) => {
      server.status=serverStatus.creatingSettings;
      sendStatusUpdate(server,"Creating default ServerProp")
      // console.log("createServerProp")
      console.log("TODO: Create default serverprop and unique port number")
      return resolve(server);
   });
}


module.exports= function (server) {
   server.status=serverStatus.untouched
   sendStatusUpdate(server,"starting creation")
   let promise = Promise.resolve(server)
   //Add server to DB
      .then(addServerToDB)
      .then(inspect)
   //ensure server directory is created
      .then(ensureServerDir)
      .then(inspect)
      //ensure server file is downloaded
      .then(ensureServerFile)
      .then(inspect)
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