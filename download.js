var io               = require("./singleton").io
var serversDB        = require("./database.js").serversDB
var hostSettingsDB   = require("./database.js").hostSettingsDB
var download = require('download')

exports.urlToFile = function(URL,dir,fileName,returnPercent){
   var down = download(URL,dir,{filename:fileName})
   var p =  new Promise((resolve, reject) => {
      down.on('error',(err)=>{
         console.log("Download Errored:",err)
         reject("File Download Failed")
      })
       down.then((data)=>{
         console.log("download Finished.data:",data)
          resolve("file downloaded")
       })
   });
   if(returnPercent){
      down.on('downloadProgress',(progress)=>{
         console.log("download progress:",progress)
         returnPercent("%"+Math.trunc(progress.percent*10000)/100)
      })
   }
   return p;
}