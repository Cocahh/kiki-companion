#!/bin/bash

# Configuration
GIST_ID="2231eed9bd7e74a78eaa27e08764ee11"
# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
LOCAL_FILE="$SCRIPT_DIR/status.json"
GIST_FILENAME="kiki-status.json"

# Check if gh is installed
if ! command -v gh &> /dev/null; then
    echo "Error: GitHub CLI (gh) is not installed."
    exit 1
fi

# Check if status.json exists
if [ ! -f "$LOCAL_FILE" ]; then
    echo "Error: $LOCAL_FILE not found."
    exit 1
fi

# Update the Gist using stdin
echo "Publishing status to Gist ($GIST_ID)..."
cat "$LOCAL_FILE" | gh gist edit "$GIST_ID" -f "$GIST_FILENAME" -

if [ $? -eq 0 ]; then
    echo "✅ Status published successfully."
else
    echo "❌ Failed to publish status."
    exit 1
fi
