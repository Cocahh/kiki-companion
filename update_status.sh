#!/bin/bash
# Quick status updater — call this whenever Kiki starts/finishes a task
# Usage: ./update_status.sh "what i'm doing" [state]

STATE="${2:-working}"
MESSAGE="$1"
SUBAGENTS="${3:-0}"

cat > status.json <<EOF
{"state": "$STATE", "message": "$MESSAGE", "subagents": $SUBAGENTS, "lastUpdate": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"}
EOF

./publish_status.sh