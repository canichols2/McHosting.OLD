
// set up needed modules
const PORT = 8888;
var express = require('express'),
    app = express(),
    http = require('http')
    server = http.Server(app),
    io = require('socket.io')(server),
    cp = require('child_process'),
    Datastore = require('nedb'),
    exec = cp.exec,
    spawn = cp.spawn,
    request = require('request'),
    cheerio = require('cheerio'),
    fs = require('fs-extra')
var vanillaVerion,forgeVersion,vVerP,fVerP
var command = require('./consoleCommands');
vVerP = getVanillaVersions()
.then((data)=>{
   vanillaVerion = data
   fVerP = getForgeVersions(vanillaVerion.recommended)
   .then((data) => {
      forgeVersion = data
   })
})

if (process.platform == "win32") {
   process.env.installDirParent = "C:/opt/minecraft/"
} else {
   process.env.installDirParent = "/opt/minecraft/"
}

var serversDB = new Datastore({filename:"servers.db",autoload:true})
var servers = [
      {
         cwd: process.env.installDirParent + "server1",
         name: "minecraftServer",
         jar: 'craftbukkit.jar',
         maxRam: '-Xmx1G',
         minRam: '-Xms512M',
         port:'25565',
         properties:{},
         log: []
      } 
]
//Seed temporary data into persistant DB
serversDB.find(
   {},
   (err,docs)=>{
      console.log("serversDB.find()")
      if(err || docs.length == 0)
      serversDB.insert(
         servers,
         (err,newDoc)=>{
            console.log("err:,",err)
            console.log("newDoc:,",newDoc)
         }
      )
      
   }
)


//create the server and start listening on the defined port
// var server = http.createServer();
server.listen(PORT);
console.log("Listening for a connection...");
console.log("Access Web GUI at http://127.0.0.1:"+PORT);
//recieves the connection from the client and passes in a socket
io.listen(server).on('connection', (socket) => {

    //log that we are connected
    console.log("The server and client are connected");
    socket.emit("connected");
    serversDB.find({},(err,servers)=>{
      socket.emit("servers", servers)
   })
   if(vanillaVerion !== null)
    socket.emit("version", vanillaVerion)
    //listen for what method to call
    socket.on("getForgeVersions", (vanillaVer, returnFunction) => {
        getForgeVersions(vanillaVer)
            .then((data) => {
                returnFunction(data)
            })
            .catch((data) => {
                returnFunction(data)
            })
    })
    socket.on("getBuildTools",()=>{getBuildTools()})
    socket.on("startServer", (data) => {
        if (data) {
            var SN = data.name
        } else {return;}
        serversDB.findOne(
           {name:SN},
           (err,doc)=>{
            //   console.log("Starting server:",SN,"Server:",doc)
              command.startServer(socket,SN,doc)
         }
      )
      

    })
    socket.on("stopServer", (data) => {
        if (data) {
            var SN = data.name
        } else {return;}
        
        serversDB.findOne(
         {name:SN},
         (err,doc)=>{
            command.stopServer(socket,SN,doc)
       }
    )
    })

    socket.on("uninstallServer", (data) => {
        if (data) {
            var SN = data.name
        } else { return; }
        
        serversDB.findOne(
         {name:SN},
         (err,doc)=>{
            command.uninstallServer(socket,SN,doc)
       }
    )
    })
    socket.on("createServer", (data, returnFunction) => {
        if (data) {
            var SN = data.servername;
            server={
                cwd: process.env.installDirParent + "servers/" + SN + "/",
                jar:"vanilla_"+data.vanilla+".jar",
                name: SN,
                vanillaVer:data.vanilla,
                port:data.port,
                maxRam: data.maxMem,
                minRam: data.minMem,
                log: []
            }
            command.installServer(socket,server)
               .then(()=>{
                  //Save server info to DB
                  console.log("attempting to add server to serversDB")
                  serversDB.insert(server)
                  console.log("added server to serversDB")
               })
               .catch((err)=>{
                  console.log("Create server failed:",err)
                  console.log("Removing failed server dir")
                  fs.remove(server.cwd,(err)=>{
                     console.log("Removing failed server dir also failed:",err)
                  })
               })
        } else {
            returnFunction("No Data Sent")
        }
    })
    socket.on("installServer", (data) => {
        command.installServer(socket,data)
        exec("cd ../..; ./minecraftCommands.sh installForge", puts)
    })

});
app.use(express.static('client'))
//Use materialize css files from node_modules directory
app.use('/materialize',express.static('./node_modules/materialize-css/dist'))







//Get BuildTools.jar
function getBuildTools(){
   var dir = process.env.installDirParent+"bin/BuildTools/"
   var buildToolsJar = dir + "BuildTools.jar"
   console.log("Starting to download build tools to:",buildToolsJar)
   var BTURL = "https://hub.spigotmc.org/jenkins/job/BuildTools/lastSuccessfulBuild/artifact/target/BuildTools.jar"
   fs.ensureDir(dir)
   .then((err)=>{
      console.log(err)
      request(BTURL)
         .pipe(
            fs.createWriteStream(buildToolsJar)
         )
   })

}


// Get latest Vanilla 
function getVanillaVersions() {
   return new Promise((res,rej)=>{
    var retData = {
        recommended: "",
        versions: []
    }

    http.get("http://launchermeta.mojang.com/mc/game/version_manifest.json", (response) => {
        body = ""
        response.on("data", (chunk) => {
            body += chunk;
        })
        response.on('end', () => {
            if (response.statusCode === 200) {
                try {
                    var tmpJSON = JSON.parse(body)
                    retData.recommended = tmpJSON.latest.release
                    for (v in tmpJSON.versions) {
                        if (tmpJSON.versions[v].type == 'release')
                            retData.versions.push(tmpJSON.versions[v].id)
                    }
                } catch (error) {
                    retData.versions = ['1.12.2'];
                    retData.recommended = '1.12.2';
                }
            } else {
                retData.versions = ['1.12.2'];
                retData.recommended = '1.12.2';
            }
        })
    })
    return res(retData);
      
   })
}

function getForgeVersions(vanillaVer) {
    return new Promise((resolve, reject) => {

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
                resolve(retData);
            } else {
                reject(false)
            }
        })
    })
}

//SPONGE: https://www.spongepowered.org/downloads/spongeforge/stable/1.12.2
//CraftBukkit:
   // Needs to be done through BuildTools.jar
