#!/usr/bin/env bash

####### Purpose #########
# To cleanup an installation.
# This should only be used if something is wrong
# of if you just want to start over.
#### NOTICE
# This will delete *** ALL *** MineCraft related data
# It will leave however the following packages installed:
# openjdk-8-jre-headless
# tmux
installDir=$(grep -oP "installDir=\K.*" ./serverInfo.properties)
if [[ -d ${installDir} ]];
then
  echo "An installation exists."
  echo "Removing..."
  rm -rf ${installDir}
  echo "Cleanup /tmp..."
  rm /tmp/mcVersion.json
  find /tmp -iname "*forge*.jar" -delete
  find /tmp -iname "*minecraft*.jar" -delete
  rm /tmp/mcVersion.json
else
  echo "${installDir} Doesn't exist. Nothing to remove."
  echo "Nothing else to see here... move along..."
fi
