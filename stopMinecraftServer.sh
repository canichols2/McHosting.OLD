#!/bin/bash

# This script is for personal use to backup a minecraft server.

echo "Stopping server..."

# Let's stop the Server

tmux send -t minecraftServer '/stop' ENTER

echo "Wait a minute while the server ends..."

# Use NodeJS for the rest of this script
#wait 120

# echo "Ok, the server has stopped"


