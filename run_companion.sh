#!/bin/bash

# Kill any existing node process on port 3847
lsof -ti:3847 | xargs kill -9 2>/dev/null

echo "🔮 Starting Kiki Status Server..."
nohup node status-server.js > server.log 2>&1 &

echo "✨ Opening Kiki Companion..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    open index.html
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    xdg-open index.html
fi

echo "✅ System Active. Check the browser!"
