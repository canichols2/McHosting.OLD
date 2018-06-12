
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
    cheerio = require('cheerio')
var vanillaVerion = getVanillaVersions(),
    forgeVersion
var command = require('./consoleCommands');
getForgeVersions(vanillaVerion.recommended)
    .then((data) => {
        forgeVersion = data
    })

if (process.platform == "win32") {
    var installDirParent = "C:/opt/minecraft/"
} else {
    var installDirParent = "/opt/minecraft/"
}
/***************************
 * TODO: load current servers, either 
 * from a file that is maintained by this app
 * or by listing directories in /opt/minecraft and
 * then reading in the JSON object stored in that dir
 ***************************
 * TODO: Store JSON file with following format to install dir.
 ***************************/
var serversDB = new Datastore({filename:"servers.db",autoload:true})
var servers = [
      {
         cwd: installDirParent + "server1",
         name: "minecraftServer",
         jar: 'craftbukkit.jar',
         maxRam: '-Xmx1G',
         minRam: '-Xms512M',
         properties:{},
         log: []
      },
      {
         cwd: "/opt/minecraft/server2",
         name: "bukkit",
         jar: 'craftbukkit.jar',
         maxRam: '-Xmx1G',
         minRam: '-Xms512M',
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
//include the modules for our server functions



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
    socket.emit("servers", servers)
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

    socket.on("startServer", (data) => {
        if (data) {
            var SN = data.name
        } else {return;}
        serversDB.findOne(
           {name:SN},
           (err,doc)=>{
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
                cwd: installDirParent + SN,
                name: SN,
                vanillaVer:data.vanilla,
                maxRam: data.maxMem,
                minRam: data.minMem,
                log: []
            }
            command.installServer(socket,server)
            serversDB.insert(server)
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




// Get latest Vanilla 
function getVanillaVersions() {
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
    return retData;
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
