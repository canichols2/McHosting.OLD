var io               = require("./singleton").io
var serversDB        = require("./database.js").serversDB
var hostSettingsDB   = require("./database.js").hostSettingsDB
var download = require('download')

exports.urlToFile = function(URL,dir,fileName,returnPercent){
   var down = download(URL,dir,{filename:fileName})
   if(returnPercent){
      down.on('downloadProgress',(progress)=>{
         returnPercent("%"+Math.trunc(progress.percent*10000)/100)
      })
   }
   var p =  new Promise((resolve, reject) => {
      down.on('error',()=>{
         reject("File Download Failed")
      })
       down.then(()=>{
          resolve("file downloaded")
       })
   });
   return p;
}