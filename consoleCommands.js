var cp = require('child_process')
var http = require('http')
var spawn = cp.spawn
var fs = require('fs-extra')
var runningServers = {}
var requestpromise = require('request-promise')
var download = require('download')

//define how arguments are used in the terminal
var puts = function (error, stdout, stderr) {
   'use strict';
   console.log(stdout);
};

function writeDefaultServerProperties(file,port){
   return new Promise((res,rej)=>{
      var propText = `
      generator-settings=
      op-permission-level=4
      allow-nether=true
      level-name=world
      enable-query=false
      allow-flight=false
      prevent-proxy-connections=false
      server-port=${port}
      max-world-size=29999984
      level-type=DEFAULT
      enable-rcon=false
      level-seed=
      force-gamemode=false
      server-ip=
      network-compression-threshold=256
      max-build-height=256
      spawn-npcs=true
      white-list=false
      spawn-animals=true
      hardcore=false
      snooper-enabled=true
      resource-pack-sha1=
      online-mode=true
      resource-pack=
      pvp=true
      difficulty=1
      enable-command-block=false
      gamemode=0
      player-idle-timeout=0
      max-players=20
      max-tick-time=60000
      spawn-monsters=true
      view-distance=10
      generate-structures=true
      motd=A Minecraft Server
      `
      fs.writeFile(file,propText)
      .then(()=>{
         console.log("file: "+file+" written")
         return res()
      })
      .catch(()=>{
         console.log("Failed to write server.prop")
         return rej("failed writting server.properties")
      })
   })
}


module.exports = {
   startServer: (socket, SN, server) =>{
      if (runningServers[SN] && runningServers[SN].exitCode === null) {
         var newData = {
            name: SN,
            log: SN + " Server is already running\n"
         }
         console.log(newData)
         socket.emit("stdOut", newData)
         server.log.push(newData.log);
      }

      runningServers[SN] = spawn('java', ['-jar', server.jar, 'nogui'], {
         cwd: server.cwd,
         stdio: ['pipe', 'pipe', 'pipe']
      })
      runningServers[SN].on('error', (data) => {
         var newData = {
            name: SN,
            type: "error",
            log: data.toString() + "\n"
         }
         console.log(newData)
         runningServers[SN].running == false
         socket.emit("stdOut", newData)
         server.log.push(newData.log);
      })
      runningServers[SN].stdout.on('data', (data) => {
         var newData = {
            name: SN,
            log: data.toString()
         }
         console.log(newData)
         socket.emit("stdOut", newData)
         server.log.push(newData.log);
      })
      runningServers[SN].on('exit',()=>{
      })
      return runningServers[SN];
   },
   stopServer: (socket, SN, server) =>{
      if (runningServers[SN] && runningServers[SN].exitCode === null) {
         runningServers[SN].stdin.write("stop\n")
      } else {
         var newData = {
            name: SN,
            type: "error",
            log: "Server " + SN + " isn't running\n"
         }
         console.log(newData)
         socket.emit("stdOut", newData)
         runningServers[SN].running == false
      }
   },
   uninstallServer: (server) =>{
      var dir = server.cwd
      if (fs.exists(dir)) {
         fs.rmdir(dir, (err) => {
            if (err) {
               console.log("Error deleting " + dir + ".", err)
            } else {
               console.log("Successfuly deleted " + dir)
            }
         })
      }
   },
   installServer: (socket, server) =>{
      return new Promise(function (resolve, reject) {
         if (fs.existsSync(server.cwd)) {
            reject("Server Folder exists. run uninstall server")
         }
         //return new server to GUI
         io.emit("addServerToList",server)
         var vanillaBinDir = process.env.installDirParent+"bin/"+"Vanilla/"
         var serverJar = vanillaBinDir + "vanilla_" + server.vanillaVer+".jar"
         var jarURL = "http://s3.amazonaws.com/Minecraft.Download/versions/" + server.vanillaVer + "/minecraft_server." + server.vanillaVer + ".jar"
         fs.ensureDir(server.cwd)
            .then(()=>{
               console.log("directory exists:",server.cwd)
               return new Promise(
                  (res,rej)=>{
                     //Check if version already exists in bin dir.
                     console.log("Checking if Server File exists:",serverJar)
                     if(!fs.existsSync(serverJar))
                     {
                        console.log("server file did not exist:",serverJar)
                        console.log("Downloading server file.")
                        //download if not exist
                        var downJar = download(jarURL,vanillaBinDir,{filename:server.jar})
                        downJar.on('downloadProgress',(progress)=>{
                           console.log("download Progress: %"+Math.trunc(progress.percent*10000)/100)
                           socket.emit('downloadProgress',{server:server,progress:progress,url:jarURL})
                        })
                        downJar.on('error',(err)=>{
                           console.log("Download server jar failed.")
                           return rej("download failed")
                        })
                        downJar.then(()=>{
                           return res()
                        })
                     }
                     else{
                        return res();
                     }
                  }
               )
            })
            .then(()=>{
               //symlink to server.jar
               console.log("Finally: Creating Symlink")
               return new Promise((res,rej)=>{
                  fs.ensureSymlink(serverJar,server.cwd+server.jar)
                  .then(()=>{
                     console.log("Symlink got created")
                     return res()
                  })
                  .catch(()=>{
                     console.log("Symlink failed to create")
                     return rej("Symlink failed")
                  })
               })
            })
            .then(()=>{
               console.log("Writing EULA")
               return new Promise((res,rej)=>{
                  fs.writeFile(server.cwd+"eula.txt", "eula=true")
                  .then(()=>{return res()})
                  .catch(()=>{return rej("EULA not created")})
               })
            })
            .then(() => {
               return new Promise((res,rej)=>{
                  writeDefaultServerProperties(server.cwd+"server.properties",server.port)
                  .then(()=>{
                     return res()
                  })
                  .catch(()=>{
                     return rej("failed writting server.properties")
                  })
               })
            })
            .then(() => {
               return new Promise((res,rej)=>{
                     //  run vanilla server 
                     console.log("inside runVanillaServer")
                     var servInstance = module.exports.startServer(socket, server.name, server)
                     servInstance.stdout.on('data',(data)=>{
                        if(data.toString().includes("Done") )
                        {
                           console.log("VanillaServer ran and hit done.")
                           servInstance.stdin.write("stop\n")
                           console.log("VanillaServer Stop message sent.")
                           servInstance.on("exit",()=>{
                              return res(true);
                           })
                        }
                     })
                     servInstance.on('error',(err)=>{
                        console.log("New Server errored:",err)
                        return rej("Server Instance Failed to run")
                     })
                  }
               )
            })
            .then(() => {
               //  set launch.json file (maxmem,launch.jar,etc.)
               console.log("inside set launch.json file")

            })
            .then(() => {
               //  download selected Forge version
               console.log("download selected forge version")
               
            })
            .then(() => {
               //  run forge version
               console.log("Run forge version")
               
            })
            .then(() => {
               //  download mods??????
               console.log("download any mods")
               
            })
            .then(()=>{
               console.log("return resolve")
               return resolve()
            })
            .catch((err)=>{
               console.log("return reject")
               return reject(err)
            })
      })
   }
};
