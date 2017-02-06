var util = require('util');
var exec = require('child_process').exec;
var puts = function(error, stdout, stderr){
   util.print(stdout);
};


//Create a date variable to make sure that we create a render using the most recent data.
  exec("latestFile='$(ls -t /home/ubuntu/minecraftBackups | head -n1)'");
  exec("echo $latestFile");



