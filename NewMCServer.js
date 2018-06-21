var io               = require("./singleton").io
var serversDB        = require("./database.js").serversDB
var hostSettingsDB   = require("./database.js").hostSettingsDB
var inspect          = require("./common").inspect;
var getSetting       = require("./common").getSetting;
var serverStatus     = require("./common").serverStatus;
var fs               = require('fs-extra')
var download         = require('./download')
var spawn            = require('child_process').spawn
var sendStatusUpdate = require('./common').sendStatusUpdate
var sendLogUpdate    = require('./common').sendLogUpdate

function sendNewServer(server,message) {
   io.emit('newServer',{
      server:server,
      message:message
   })
}

function checkForServerFile(server){
   return new Promise((resolve, reject) => {
      fs.pathExists(server.binDir+server.binjar+".jar")
      .then((exists)=>{
         if(exists){
            resolve(server,true);
         }else{
            resolve(server,false);
         }
      })
   });
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
               
               sendNewServer(server)
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
      console.log("inside ensureBuildTools.Promise",server)
      fs.pathExists(server.binDir+server.type+"-"+server.shortVersion+".jar")
      .then((exists)=>{
         console.log("inside ensureBuildTools.Promise.fs.pathExists.then()",server)
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
            resolve(server)
         }
      
      })
   })
}
function cleanupBuildToolsFolder(server){
   return new Promise((resolve, reject) => {
       console.log("cleaning up BuildToolsFolder")
       fs.remove(server.binDir+"BuildData/")
       .then(()=>{
         return fs.remove(server.binDir+"bukkit/")
        })
       .then(()=>{
         return fs.remove(server.binDir+"CraftBukkit/")
        })
       .then(()=>{
         return fs.remove(server.binDir+"Spigot/")
        })
       .then(()=>{
         return fs.remove(server.binDir+"work/")
        })
        .then(()=>{
           resolve(server)
        })
        .catch(reject)
   });
}
function ensureBTserverjar(server,tryNum) {
   console.log("EnsureBTServerJar",server)
   var GenServerJars = spawn("java",
      ['-jar',"buildtools.jar","--rev",server.shortVersion],{
         cwd:server.binDir,
         stdio: ['pipe', 'pipe', 'pipe']
      })
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
         else{
            //cleanup BuildToolsFolder
            if(tryNum > 2){
               reject("Tried cleaning up folder and failed")
            }
            cleanupBuildToolsFolder(server)
            .then(()=>{
               ensureBTServerJar(server,tryNum+1)
            })
            .catch(()=>{
               console.log("not sure why spawn java broke:",data,"GenServersJars.exitCode:",GenServerJars.exitCode)
               reject("Downloading Server Jar from BuildTools crashed")
            })
         }
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
            var jarURL = "http://s3.amazonaws.com/Minecraft.Download/versions/" + server.shortVersion + "/minecraft_server." + server.shortVersion + ".jar"
            getSetting("serversDir")
            .then((dir)=>{
               server.binDir = dir+'bin/vanilla/'
               server.binJar = 'vanilla_'+server.shortVersion+".jar"
               return server;}
            )
            .then(checkForServerFile)
            .then((server,exists)=>{
               if(!exists){
                  download.urlToFile(
                     jarURL,
                     server.binDir,
                     server.binJar,
                     (percent)=>{
                        server.status=serverStatus.downloading;
                        sendStatusUpdate(server,`Downloading ${server.binJar}: ${percent}`)
                     })
                     .then(()=>{
                        return server
                     })
               }else{
                  return server
               }
            })
            break;
         case "forge":
            getSetting("serversDir")
               .then((dir)=>{
                  server.binDir = dir+'bin/vanilla/'
                  return server;
               })
               .then(getForgeVersions)
               .then((server)=>{
                  server.binJar = 'forge_'+server.shortVersion+".jar"
                  return server;
               })
               .then(checkForServerFile)
               .then((server,exists)=>{
                  if(!exists){
                     var jarURL = `http://files.minecraftforge.net/maven/net/minecraftforge/forge/${server.forgeVersion}/forge-${server.forgeVersion}-universal.jar`
                     download.urlToFile(
                        jarURL,
                        server.binDir,
                        server.binJar,
                        (percent)=>{
                           server.status=serverStatus.downloading;
                           sendStatusUpdate(server,`Downloading ${server.binJar}: ${percent}`)
                        }
                     ).then(()=>{return server})
                  }else{
                     return server;
                  }
               })
            
            break;
         case "spigot":
         case "craftbukkit":
         getSetting("serversDir")
            .then((dir)=>{
               server.binDir = dir+"bin/BuildTools/";
               console.log("getSetting('serversDir')",server)
               return server;})
            .then(ensureBuildTools)
            .then(ensureBTserverjar)
            .catch((err)=>{
               console.log("EnsureBTserverJar crashed",err)
               throw(err)
            })
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
      console.log("Create default serverprop and unique port number")
      if(typeof(server.properties) === 'undefined')
         server.properties={}
      server.properties['generator-settings']=server.properties['generator-settings']||''
      server.properties['op-permission-level']=server.properties['op-permission-level']||'4'
      server.properties['allow-nether']=server.properties['allow-nether']||'true'
      server.properties['level-name']=server.properties['level-name']||'world'
      server.properties['enable-query']=server.properties['enable-query']||'false'
      server.properties['allow-flight']=server.properties['allow-flight']||'false'
      server.properties['prevent-proxy-connections']=server.properties['prevent-proxy-connections']||'false'
      server.properties['server-port']=server.properties['server-port']||'${port}'
      server.properties['max-world-size']=server.properties['max-world-size']||'29999984'
      server.properties['level-type']=server.properties['level-type']||'DEFAULT'
      server.properties['enable-rcon']=server.properties['enable-rcon']||'false'
      server.properties['level-seed']=server.properties['level-seed']||''
      server.properties['force-gamemode']=server.properties['force-gamemode']||'false'
      server.properties['server-ip']=server.properties['server-ip']||''
      server.properties['network-compression-threshold']=server.properties['network-compression-threshold']||'256'
      server.properties['max-build-height']=server.properties['max-build-height']||'256'
      server.properties['spawn-npcs']=server.properties['spawn-npcs']||'true'
      server.properties['white-list']=server.properties['white-list']||'false'
      server.properties['spawn-animals']=server.properties['spawn-animals']||'true'
      server.properties['hardcore']=server.properties['hardcore']||'false'
      server.properties['snooper-enabled']=server.properties['snooper-enabled']||'true'
      server.properties['resource-pack-sha1']=server.properties['resource-pack-sha1']||''
      server.properties['online-mode']=server.properties['online-mode']||'true'
      server.properties['resource-pack']=server.properties['resource-pack']||''
      server.properties['pvp']=server.properties['pvp']||'true'
      server.properties['difficulty']=server.properties['difficulty']||'1'
      server.properties['enable-command-block']=server.properties['enable-command-block']||'false'
      server.properties['gamemode']=server.properties['gamemode']||'0'
      server.properties['player-idle-timeout']=server.properties['player-idle-timeout']||'0'
      server.properties['max-players']=server.properties['max-players']||'20'
      server.properties['max-tick-time']=server.properties['max-tick-time']||'60000'
      server.properties['spawn-monsters']=server.properties['spawn-monsters']||'true'
      server.properties['view-distance']=server.properties['view-distance']||'10'
      server.properties['generate-structures']=server.properties['generate-structures']||'true'
      server.properties['motd']=server.properties['motd']||'A Minecraft Server'
      
      var propText = `
      generator-settings=${server.properties['generator-settings']}\n
      op-permission-level=${server.properties['op-permission-level']}\n
      allow-nether=${server.properties['allow-nether']}\n
      level-name=${server.properties['level-name']}\n
      enable-query=${server.properties['enable-query']}\n
      allow-flight=${server.properties['allow-flight']}\n
      prevent-proxy-connections=${server.properties['prevent-proxy-connections']}\n
      server-port=${server.properties['server-port']}\n
      max-world-size=${server.properties['max-world-size']}\n
      level-type=${server.properties['level-type']}\n
      enable-rcon=${server.properties['enable-rcon']}\n
      level-seed=${server.properties['level-seed']}\n
      force-gamemode=${server.properties['force-gamemode']}\n
      server-ip=${server.properties['server-ip']}\n
      network-compression-threshold=${server.properties['network-compression-threshold']}\n
      max-build-height=${server.properties['max-build-height']}\n
      spawn-npcs=${server.properties['spawn-npcs']}\n
      white-list=${server.properties['white-list']}\n
      spawn-animals=${server.properties['spawn-animals']}\n
      hardcore=${server.properties['hardcore']}\n
      snooper-enabled=${server.properties['snooper-enabled']}\n
      resource-pack-sha1=${server.properties['resource-pack-sha1']}\n
      online-mode=${server.properties['online-mode']}\n
      resource-pack=${server.properties['resource-pack']}\n
      pvp=${server.properties['pvp']}\n
      difficulty=${server.properties['difficulty']}\n
      enable-command-block=${server.properties['enable-command-block']}\n
      gamemode=${server.properties['gamemode']}\n
      player-idle-timeout=${server.properties['player-idle-timeout']}\n
      max-players=${server.properties['max-players']}\n
      max-tick-time=${server.properties['max-tick-time']}\n
      spawn-monsters=${server.properties['spawn-monsters']}\n
      view-distance=${server.properties['view-distance']}\n
      generate-structures=${server.properties['generate-structures']}\n
      motd=A Minecraft ${server.properties['motd']}\n
      `
      // generator-settings
      // op-permission-level
      // allow-nether
      // level-name
      // enable-query
      // allow-flight
      // prevent-proxy-connections
      // server-port
      // max-world-size
      // level-type
      // enable-rcon
      // level-seed
      // force-gamemode
      // server-ip
      // network-compression-threshold
      // max-build-height
      // spawn-npcs
      // white-list
      // spawn-animals
      // hardcore
      // snooper-enabled
      // resource-pack-sha1
      // online-mode
      // resource-pack
      // pvp
      // difficulty
      // enable-command-block
      // gamemode
      // player-idle-timeout
      // max-players
      // max-tick-time
      // spawn-monsters
      // view-distance
      // generate-structures
      // motd
      fs.writeFile(server.cwd+"server.properties",propText)
      .then(()=>{resolve(server)})
      .catch(()=>{
         reject("Writing Server Prop wasn't able to be written")
      })
   });
}

module.exports.createServerProp = createServerProp
module.exports.all= function (server) {
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
function getForgeVersions(server) {
   return new Promise((resolve, reject) => {
       var vanillaVer = server.shortVersion
       var retData = {
           recommended: "",
           versions: []
       }
       console.log("vanillaVer", vanillaVer)
       if (vanillaVer) {
           url = 'http://files.minecraftforge.net/maven/net/minecraftforge/forge/index_' + vanillaVer + '.html';
       } else {
           url = 'http://files.minecraftforge.net/';
       }
       console.log('url', url)
       request(url, function (error, response, html) {
           if (!error) {
               if (html.toString().includes("404 Not Found")) {
                   console.log("Forge: No forge version for this release")
                   reject(false)
               }
               var $ = cheerio.load(html);
               $('.promos-content .download .promo-recommended~small').filter(function () {
                   var data = $(this);
                   // console.log("recommended",data.text())
                   var string = data.text()
                   string = string.replace(/\s/g, "");
                   retData.recommended = string;
               })
               $('.download-list tbody td.download-version').filter(function () {
                   var data = $(this);
                   var string = data.text()
                   string = string.replace(/\s/g, "");
                   retData.versions.push(vanillaVer + "-" + string)
               })
               // console.log("Forge: ",retData)
               server.forgeVersion=retData.recommended
               resolve(server);
           } else {
               reject(false)
           }
       })
   })
}