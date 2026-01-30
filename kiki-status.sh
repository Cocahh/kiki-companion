#!/bin/bash
# Quick status update helper
# Usage: kiki-status "state" "message" [subagents]

STATE="${1:-working}"
MESSAGE="${2:-}"
SUBAGENTS="${3:-0}"

cat > /Users/luizleite/clawd/kiki-companion/status.json << EOF
{
  "state": "$STATE",
  "message": "$MESSAGE",
  "subagents": $SUBAGENTS,
  "lastUpdate": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

# Auto-publish
echo "Publishing..."
/Users/luizleite/clawd/kiki-companion/publish_status.sh
