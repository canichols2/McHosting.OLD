var io               = require("./singleton").io
var hostSettingsDB   = require("./database.js").hostSettingsDB
exports.serverStatus = Object.freeze({
   untouched:0,
   created:1,
   downloading:2,
   downloaded:3,
   creatingSettings:4,
   runingInitial:5,
   running:6,
   online:7,
   offline:8,
})
exports.inspect = function inspect(_in, optionalMessage) {
   console.log(optionalMessage||"Inspect:", _in);
   return _in;
}
exports.getSetting = function getSetting(key)
{
   return new Promise((resolve, reject) => {
      hostSettingsDB.findOne({"key":key},(err,doc)=>{
         if(err){return reject(`${key} was not found in hostSettingsDB`)}
            console.log("doc:",doc)
            return resolve(doc.value);
      })
   });
}

exports.sendStatusUpdate = function sendStatusUpdate(server,message) {
   io.emit('statusUpdate',{
      server:server,
      message:message
   })
}
exports.sendLogUpdate = function sendLogUpdate(server,message) {
   io.emit('logUpdate',{
      server:server,
      message:message
   })
}