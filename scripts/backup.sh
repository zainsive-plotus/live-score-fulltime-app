#!/bin/bash

# ==============================================================================
# Fanskor MongoDB Backup Script
#
# This script automatically backs up the MongoDB database using the connection
# string defined in the project's .env.local file.
# It creates a date-stamped backup directory for easy management.
#
# Usage:
# ./scripts/backup.sh
# ==============================================================================

# --- Configuration ---
# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
# Navigate to the project's root directory (one level up from /scripts)
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
# Define where to store the backups
BACKUP_DIR="$PROJECT_ROOT/backups"
# Define the name of the environment file
ENV_FILE="$PROJECT_ROOT/.env.local"

# --- Script Logic ---

echo "Starting database backup..."

# 1. Check if the .env.local file exists
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ ERROR: .env.local file not found at $ENV_FILE"
    exit 1
fi

# 2. Extract the MONGODB_URI from the .env.local file
# This command safely reads the file, finds the correct line, and extracts the value after the '='
MONGODB_URI=$(grep "NEXT_PUBLIC_MONGODB_URI" "$ENV_FILE" | cut -d '=' -f2- | sed 's/"//g')

if [ -z "$MONGODB_URI" ]; then
    echo "❌ ERROR: NEXT_PUBLIC_MONGODB_URI could not be found in $ENV_FILE"
    exit 1
fi

echo "✓ Database URI found."

# 3. Create the main backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"
echo "✓ Backup directory is ready at $BACKUP_DIR"

# 4. Define the final output path with today's date (YYYY-MM-DD)
DATE=$(date +%F)
FINAL_BACKUP_PATH="$BACKUP_DIR/backup-$DATE"

# 5. Run the mongodump command
echo "Dumping database to $FINAL_BACKUP_PATH..."
mongodump --uri="$MONGODB_URI" --out="$FINAL_BACKUP_PATH"

# 6. Check the exit code of the mongodump command
if [ $? -eq 0 ]; then
    echo "✅ Backup completed successfully!"
else
    echo "❌ ERROR: mongodump command failed. Please check the output above for errors."
    exit 1
fi

exit 0