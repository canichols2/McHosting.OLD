var util = require('util');
var exec = require('child_process').exec;
var puts = function(error, stdout, stderr){
   util.print(stdout);
};

var date = new Date();
var timestamp = (date.getMonth() + 1) + "/" + date.getDate()  + "/" +
                 date.getFullYear()   + " " + date.getHours() + ":" + 
                 date.getMinutes()    + ":" + date.getSeconds();


console.log("Script is running - " + timestamp);

function stopTheServer(){
  exec("./stopMinecraftServer.sh", puts);
};

function backUp(){
  console.log("Server has been stopped...");
  exec("./backupMinecraftServer.sh", puts);
};

function render(){
  console.log("Server has been backed up...");
   exec("./renderMineCraftMap.sh", puts);
};

function finished(){
  console.log("The render has finished");
}

//run the scripts...and hold your breath!
stopTheServer();
setTimeout(backUp,  60000);            // 1 minute
setTimeout(render,  60000);            // 1 minute
setTimeout(finished, 600000);          // 10 minutes
