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
   //stop the server
   console.log("Stopping the server...1 minute till backup");
   exec("tmux send -t minecraftServer '/stop' ENTER", puts);
};

function backUp(){
   //back it up brah
   console.log("Starting backup...1 minutes till render");
   exec("tmux send -t minecraftServer 'find /home/ubuntu/minecraftBackups -mtime +7 -exec rm {} \;' ENTER", puts);

  //now move to the correct dir
  exec("tmux send -t minecraftServer 'cd /home/ubuntu/minecraftBackups' ENTER", puts);

  //and make a date var for the file name (I hope this works in .js :/
  exec("today=`date '+%Y_%m_%d_%H_%M'`;", puts);

  //write the file
  exec("tmux send -t minecraftServer 'tar -czvf '$today'minecraft.tar /home/ubuntu/minecraft' ENTER", puts);
};

function render(){
   console.log("Starting the render...25 minutes till webServer updates");
  
  //move to the backups folder
  exec("tmux send -t minecraftServer 'cd /home/ubuntu/minecraftBackups' ENTER", puts);

  //Create a var to keep track of the latest file
  exec("latestFile=$(ls -t /home/ubuntu/minecraftBackups | head -n1)");
  exec("echo $latestFile");

  //delete the previous render's extract"
  exec("tmux send -t minecraftServer 'rm -rf ./home' ENTER", puts);

  //Uncompress the backup we made a moment ago
  exec("tmux send -t minecraftServer 'tar -xf '$latestFile ENTER", puts);

  //Move into the correct directory to begin the render"
  exec("tmux send -t minecraftServer 'cd ./home/ubuntu/minecraft/' ENTER", puts);

  //Begin the render process!
  exec("tmux send -t minecraftServer 'overviewer.py --rendermodes=smooth-lighting ./MCMadness /home/ubuntu/mcOverview' ENTER", puts);
};

function updateWebServer(){
  console.log("Starting webServerUpdate...");

  //Render should be complete! Now copying files to web server
  exec("tmux send -t minecraftServer 'cp -R /home/ubuntu/mcOverview/* /var/www/minecraft/' ENTER", puts);

  //Remove the index.html created by the render
  exec("tmux send -t minecraftServer 'rm /var/www/minecraft/index.html' ENTER", puts);

  //Replace index.html with the authenticatation index.html
  exec("tmux send -t minecraftServer 'cp /home/ubuntu/minecraft/index.html.bak /var/www/minecraft/index.html' ENTER", puts);

  //Make sure the .htaccess file is present to ensure better security
  exec("tmux send -t minecraftServer 'cp /home/ubuntu/minecraft/.htaccess /var/www/minecraft/.htaccess' ENTER", puts);

  //Cleaning the mcOverview directory for future use...
  exec("tmux send -t minecraftServer 'rm -rf /home/ubuntu/mcOverview/*' ENTER", puts);

  //Cleaning up uncompressed backup...
  exec("tmux send -t minecraftServer 'rm -rf /home/ubuntu/minecraftBackups/home' ENTER", puts);

  //Render process complete! Go to http://minecraft.ardenshackelford.com to view it!"

};

//run the scripts...and hold your breath!
stopTheServer();
setTimeout(backUp,  60000);            // 1 minute
setTimeout(render,  60000);            // 1 minute
setTimeout(updateWebServer, 1500000 ); //25 minutes
