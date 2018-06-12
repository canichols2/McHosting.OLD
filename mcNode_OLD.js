var util = require('util');
var exec = require('child_process').exec;
var puts = function (error, stdout, stderr) {
    util.print(stdout);
};

var date = new Date();
var timestamp = (date.getMonth() + 1) + "/" + date.getDate() + "/" +
    date.getFullYear() + " " + date.getHours() + ":" +
    date.getMinutes() + ":" + date.getSeconds();


console.log("Script is running - " + timestamp);

function stopTheServer() {
//    exec("./stopMinecraftServer.sh", puts);
};

function startTheServer() {
//    exec("./startMinecraftServer.sh", puts);
    exec("ls /home/arden/Documents", puts);
};

function backUp() {
//    console.log("Server has been stopped...");
//    exec("./backupMinecraftServer.sh", puts);
};

function backupCleanup() {
//    exec("find /home/ubuntu/minecraftBackups -mtime +7 -exec rm {} \;");
}

function render() {
//    console.log("Server has been backed up...");
//    exec("./renderMineCraftMap.sh", puts);
};

function finished() {
//    console.log("The render has finished");
};

////run the scripts...and hold your breath!
//startTheServer();
//setTimeout(stopTheServer, 20000); // 20 Seconds
//setTimeout(backUp, 40000); // 40 Seconds
//setTimeout(render, 60000); // 1 Minute
//setTimeout(finished, 900000); // 15 Minutes