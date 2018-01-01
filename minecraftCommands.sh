#!/usr/bin/env bash

## Compile all existing functionality into once script that uses functions

serverType=$1
action=$2
serverProperties="./serverInfo.properties"
serverVersions="./versions.txt"
installDir=$(grep -oP "installDir=\K.*" ${serverProperties})
Xms=$(grep -oP "minMem=\K.*" ${serverProperties})
Xmx=$(grep -oP "maxMem=\K.*" ${serverProperties})
vanillaVersion=$(grep -oP "vanillaVersion=\K.*" ${serverProperties})
forgeVersion=$(grep -oP "forgeVersion=\K.*" ${serverProperties})

# Start MC Server

backupServer() {

  ######################
  # Backup Naming
  ######################
  echo "Set variable for backup name."

  # Create a variable that will use today's date.
  today=`date '+%Y_%m_%d_%H_%M'`;

  # Use today's date variable to create the name of the backup file.

  echo "We'll move into the backup directory then create the backup"
  tmux send -t minecraftServer 'cd /home/ubuntu/minecraftBackups' ENTER

  echo "Creating tar of server..."
  tmux send -t minecraftServer 'tar -czvf '$today'minecraft.tar /home/ubuntu/minecraft' ENTER

  completeBackup='$(ls -t /home/ubuntu/minecraftBackups | head -n1)'

  echo "Backup name = $comleteBackup"

  #####################
  # End Backup Naming
  # Start Backup Process
  #####################

  echo "Starting backup of server..."

  # Create a variable that will use today's date.
  today=`date '+%Y_%m_%d_%H_%M'`;

  # Use today's date variable to create the name of the backup file.

  echo "We'll move into the backup directory then create the backup"
  tmux send -t minecraftServer 'cd /home/ubuntu/minecraftBackups' ENTER

  echo "Creating tar of server..."
  tmux send -t minecraftServer 'tar -czvf '$today'minecraft.tar /home/ubuntu/minecraft' ENTER

  echo "And we'll wait for the tar to be created - 10 Minutes"

  # Split the script here. Two files or however.
  # wait 600

  echo "The backup has completed"

  completeBackup='$(ls -t /home/ubuntu/minecraftBackups | head -n1)'

  echo "Backup name = $comleteBackup"
  # Now  we'll move the tar file to the backups directory.
  # echo "Moving newly created backup to the backups directory."
  # tmux send -t minecraftServer 'mv *.tar /home/ubuntu/minecraftBackups' ENTER

  echo "Backup complete!"
}

getLatestVersions() {

  # Check Vanilla Server Version
  vanillaManifest="https://launchermeta.mojang.com/mc/game/version_manifest.json"
  wget -qN  ${vanillaManifest} -O /tmp/vanillaMCVersion.json
  vanillaVersion=$(grep -oP "\"release\":\"\K\d{1,2}\.\d{1,2}\.\d{1,2}" /tmp/vanillaMCVersion.json)
  # Add version to serverInfo.properties
  sed -i "s/(vanillaVersion=).*/\1${vanillaVersion}" versions.txt

  # Check Forge Version

  echo "Getting MineCraft Forge server files..."
  forgeManifest="/tmp/forgeManifest.html"
  wget -qN https://files.minecraftforge.net  -O ${forgeManifest}

  # Find Recommended Version
  recommendedForge=$(grep -A1 "Download Recommended" ${forgeManifest} | grep -oP "<small>\K\d{1,2}\.\d{1,2}\.\d{1,2} - \d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,4}" | sed 's/[[:space:]]//g')

  ## Set Recommended Version in versions.txt


  # Find Latest Version
  latestForge=$(grep -A1 "Download Latest" ${forgeManifest} | grep -oP "<small>\K\d{1,2}\.\d{1,2}\.\d{1,2} - \d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,4}" | sed 's/[[:space:]]//g')

  ## Set Latest Version in versions.txt
}

startServer() {
  # Let's start the Server
  tmux new -ds minecraftServer
  tmux send -t minecraftServer 'cd '${installDir} ENTER
  echo "Starting ${serverType} server..."
  case $serverType in
    "vanilla")
      if [[ -f ${installDir}minecraft_server.${vanillaVersion}.jar ]];
      then
        tmux send -t minecraftServer 'java -Xms'${Xms}' -Xms'${Xmx}' -jar '${installDir}'minecraft_server.'${vanillaVersion}'.jar nogui' ENTER
      else
        echo "Failed to start server; ${installDir}minecraft_server.${vanillaVersion}.jar could not be found."
        echo "Please look into this and try again."
        exit 1
      fi
      ;;
    "forge")
      if [[ -f ${installDir}forge-${forgeVersion}-universal.jar ]];
      then
        tmux send -t minecraftServer 'java -Xms'${Xms}' -Xms'${Xmx}' -jar '${installDir}'forge-'${forgeVersion}'-universal.jar nogui' ENTER
      else
        echo "Failed to start server; ${installDir}forge-${forgeVersion}-universal.jar could not be found."
        echo "Please look into this and try again."
        exit 1
      fi
      ;;
    *)
      echo "Provided server type not recognized."
      echo "Usage: minecraftCommands.sh vanilla|forge"
  esac

}

stopServer() {
  tmux send -t minecraftServer '/stop' ENTER
}

usage() {
  echo "minecraftCommands.sh vanilla|forge startServer|stopServer|backupServer"
}

case $action in
  "startServer")
    startServer
    ;;
  "stopServer")
    stopServer
    ;;
  "backupServer")
    backupServer
    ;;
  *)
    echo "Action not recognized."
    usage
    ;;
esac




# Stop MC Server

# Backup MC Server
