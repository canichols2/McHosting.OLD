#!/usr/bin/env bash

## Compile all existing functionality into once script that uses functions

action=$1
serverProperties="./serverInfo.properties"
serverVersions="./versions.txt"
installDir=$(grep -oP "installDir=\K.*" ${serverProperties})
Xms=$(grep -oP "minMem=\K.*" ${serverProperties})
Xmx=$(grep -oP "maxMem=\K.*" ${serverProperties})
vanillaVersion=$(grep -oP "vanillaVersion=\K.*" ${serverProperties})
forgeVersion=$(grep -oP "forgeVersion=\K.*" ${serverProperties})
backupDir=$(grep oP "backupDir=\K.*" ${serverProperties})

# Start MC Server

backupServer() {

  # Check for Backup Dir
  if [[ -d ${backupDir} ]];
  then
    echo "Backup directory exists. Continuing to backup."
  else
    echo "Backup dir doesn't exist. Creating..."
    mkdir ${backupDir}
    if [[ -d ${backupDir} ]];
    then
      echo "Backup dir created. Moving on to backup..."
    else
      echo "Backup dir not created. Please check permissions for creating ${backupDir}"
      echo "Then re-run the backup."
      exit 4
    fi
  fi

  ######################
  # Backup Naming
  ######################
  # TODO Add functionality to backup per World
  echo "Set variable for backup name."
  # Create a variable that will use today's date.
  # Format: Year-Month-Day-Hour-Minute
  backupTimeStamp=`date '+%Y-%m-%d-%H-%M'`;

  echo "We'll move into the backup directory then create the backup"
  tmux send -t minecraftServer 'cd '${backupDir} ENTER

  echo "Creating compressed tar of server..."
  tmux send -t minecraftServer 'tar -czvf '${backupTimeStamp}'minecraft.tar '${installDir} ENTER
  echo "And we'll wait for the tar to be created - 5 Minutes"
  # This ensures no other commands are thrown at the server during the backup
  sleep 300
  completeBackup=$(ls -t /home/ubuntu/minecraftBackups | head -n1)

  echo "Backup name = $completeBackup"
  echo "Backup Complete!"
}

getLatestVersions() {

  # Check Vanilla Server Version
  vanillaManifest="https://launchermeta.mojang.com/mc/game/version_manifest.json"
  wget -qN  ${vanillaManifest} -O /tmp/vanillaMCVersion.json
  vanillaVersion=$(grep -oP "\"release\":\"\K\d{1,2}\.\d{1,2}\.\d{1,2}" /tmp/vanillaMCVersion.json)
  # Add version to serverInfo.properties
  sed -i "s/(vanillaVersion=).*/\1${vanillaVersion}" ${serverVersions}

  # Check Forge Version

  echo "Getting MineCraft Forge server files..."
  forgeManifest="/tmp/forgeManifest.html"
  wget -qN https://files.minecraftforge.net  -O ${forgeManifest}

  # Find Recommended Version
  recommendedForge=$(grep -A1 "Download Recommended" ${forgeManifest} | grep -oP "<small>\K\d{1,2}\.\d{1,2}\.\d{1,2} - \d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,4}" | sed 's/[[:space:]]//g')

  ## Set Recommended Version in versions.txt
  sed -i "s/(recommendedForge=).*/\1${recommendedForge}" ${serverVersions}

  # Find Latest Version
  latestForge=$(grep -A1 "Download Latest" ${forgeManifest} | grep -oP "<small>\K\d{1,2}\.\d{1,2}\.\d{1,2} - \d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,4}" | sed 's/[[:space:]]//g')

  ## Set Latest Version in versions.txt
  sed -i "s/(latestForge=).*/\1${latestForge}" ${serverVersions}
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
  "installVanilla")
    serverType="vanilla"
    installServer
    ;;
  "installForge")
    serverType="forge"
    installServer
    ;;
  "getVersions")
    getLatestVersions
    ;;
  *)
    echo "Action not recognized."
    usage
    ;;
esac




# Stop MC Server

# Backup MC Server
