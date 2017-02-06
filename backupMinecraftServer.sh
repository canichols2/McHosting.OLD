#!/bin/bash

# This script is for personal use to backup a minecraft server.

# Just to be safe, we'll stop the server.

echo "Stopping the MineCraft server..."

/home/ubuntu/minecraft/stopMinecraftServer.sh

echo "Remove backups older than 1 week (7 Days)"
tmux send -t minecraftServer 'find /home/ubuntu/minecraftBackups -mtime +7 -exec rm {} \;' ENTER

echo "Starting backup of server..."

# Create a variable that will use today's date.
today=`date '+%Y_%m_%d_%H_%M'`;

# Use today's date variable to create the name of the backup file.

echo "We'll move into the backup directory then create the backup"
tmux send -t minecraftServer 'cd /home/ubuntu/minecraftBackups' ENTER

echo "Creating tar of server..."
tmux send -t minecraftServer 'tar -czvf '$today'minecraft.tar /home/ubuntu/minecraft' ENTER

echo "And we'll wait for the tar to be created - 10 Minutes"
wait 600

echo "The backup has completed"

completeBackup='$(ls -t /home/ubuntu/minecraftBackups | head -n1)'

echo "Backup name =$comleteBackup"
# Now  we'll move the tar file to the backups directory.
# echo "Moving newly created backup to the backups directory."
# tmux send -t minecraftServer 'mv *.tar /home/ubuntu/minecraftBackups' ENTER

echo "Backup complete!"
