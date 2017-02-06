#!/bin/bash

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
