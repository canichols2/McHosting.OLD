
var hostSettingsDB   = require("./database.js").hostSettingsDB

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