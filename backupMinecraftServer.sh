#!/bin/bash

# This script is for personal use to backup a minecraft server.

# Just to be safe, we'll stop the server.

echo "Stopping the MineCraft server..."

/home/ubuntu/minecraft/stopMinecraftServer.sh

echo "Starting backup of server..."

# Create a variable that will use today's date.
today=`date '+%Y_%m_%d_%H_%M'`;

# Use today's date variable to create the name of the backup file.

echo "Creating tar of server..."
tmux send -t minecraftServer 'tar -czvf '$today'minecraft.tar /home/ubuntu/minecraft' ENTER

# Now  we'll move the tar file to the backups directory.
echo "Moving newly created backup to the backups directory."
tmux send -t minecraftServer 'mv *.tar /home/ubuntu/minecraftBackups' ENTER

echo "Backup complete!"
