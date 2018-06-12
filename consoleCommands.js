var cp = require('child_process')
var http = require('http')
var spawn = cp.spawn
var fs = require('fs-extra')
var runningServers = {}
var requestpromise = require('request-promise')


//define how arguments are used in the terminal
var puts = function (error, stdout, stderr) {
   'use strict';
   console.log(stdout);
};



module.exports = {
   startServer: (socket, SN, server) =>{
      if (runningServers[SN] && runningServers[SN].connected) {
         var newData = {
            name: SN,
            log: SN + " Server is already running\n"
         }
         console.log(newData)
         socket.emit("stdOut", newData)
         server.log.push(newData.log);
      }

      console.log("Starting server:",SN);console.log("Server:",server)
      runningServers[SN] = spawn('java', ['-jar', server.jar, 'nogui'], {
         cwd: server.cwd,
         stdio: ['pipe', 'pipe', 'pipe']
      })
      console.log("server:",SN);console.log("runningServer:",runningServers[SN])
      runningServers[SN].on('error', (data) => {
         var newData = {
            name: SN,
            type: "error",
            log: data.toString() + "\n"
         }
         console.log(newData)
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
      return runningServers[SN];
   },
   stopServer: (socket, SN, server) =>{
      if (runningServers[SN] && runningServers[SN].connected) {

         runningServers[SN].on('error', (data) => {
            var newData = {
               name: SN,
               type: "error",
               log: data.toString()
            }
            console.log(newData)
            socket.emit("stdOut", newData)
            server.log.push(newData.log);
         })
         console.log(runningServers[SN])
         console.log(runningServers[SN].stdin)
         runningServers[SN].stdin.write("stop\n")
      } else {
         var newData = {
            name: SN,
            type: "error",
            log: "Server " + SN + " isn't running\n"
         }
         console.log(newData)
         socket.emit("stdOut", newData)
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
         socket.emit("addServerToList",server)
         var jarURL = "http://s3.amazonaws.com/Minecraft.Download/versions/" + server.vanillaVer + "/minecraft_server." + server.vanillaVer + ".jar"
         fs.ensureDir(server.cwd)
            .then(()=>{
               return new Promise(
                  (res,rej)=>{
                     console.log("creating server.jar")
                     const jarFile = fs.createWriteStream(server.cwd+server.jar);
                     var req = request(jarURL)
                     req.pipe(jarFile)
                     console.log("RequestStatus:",req)
                     setTimeout(()=>{
                        console.log("RequestStatus:",req)
                     },10000)
                     req.on("error",(err)=>{
                        console.log("Request Error:",err)
                     })
                     jarFile.on("finish",()=>{
                        console.log("WriteStream: Jar File finished downloading")
                        res(true)
                     })
                     jarFile.on("error",()=>{
                        console.log("WriteStream: couldn't download the file.")
                        rej("WriteStream: Couldn't download file")
                     })
                     }
                  )
            })
            .then(()=>{
               console.log("Writing EULA")
               return fs.writeFile(server.cwd+"eula.txt", "eula=true")
            })
            .then(() => {
               return new Promise(
                  (res,rej)=>{
                     //  run vanilla server 
                     console.log("inside runVanillaServer")
                     var servInstance = module.exports.startServer(socket, server.name, server)
                     servInstance.stdout.on('data',(data)=>{
                        if(data.toString().includes("Done") )
                        {
                           console.log("VanillaServer ran and hit done.")
                           servInstance.stdin.write("stop\n")
                           console.log("VanillaServer Stop message sent.")
                           return res(true);
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
                  //  get or update server.properties
                  console.log("inside get/update server.properties")
                  setTimeout(()=>{
                     console.log("in server.properties. after waiting a few seconds.")
                  },10000)
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
               return resolve(resolve)
            })
            .catch((err)=>{
               console.log("return reject")
               return reject(err)
            })
      })
   }
};
