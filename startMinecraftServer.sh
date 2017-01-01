#!/bin/bash

# This script is for personal use to backup a minecraft server.

echo "Starting server..."

# Let's stop the Server
tmux send -t minecraftServer 'cd /home/ubuntu/minecraft' ENTER
tmux new -ds minecraftServer
tmux send -t minecraftServer 'java -Xmx512M -Xms128M -jar /home/ubuntu/minecraft/minecraft_server.1.11.2.jar nogui' ENTER

