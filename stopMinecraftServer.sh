#!/bin/bash

# This script is for personal use to backup a minecraft server.

echo "Stopping server..."

# Let's stop the Server

tmux send -t minecraftServer '/stop' ENTER
