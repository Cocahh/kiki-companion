#!/usr/bin/env node
// Kiki Status Watcher
// Monitors Clawdbot gateway sessions and updates status.json in real-time

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const STATUS_FILE = '/Users/luizleite/clawd/kiki-companion/status.json';
const PUBLISH_SCRIPT = '/Users/luizleite/clawd/kiki-companion/publish_status.sh';
const POLL_INTERVAL = 5000; // 5 seconds
const IDLE_TO_SLEEP_MS = 15 * 60 * 1000; // 15 minutes

let lastState = 'idle';
let lastMessage = '';
let lastSubagents = 0;

// Phrases for different activities (Intellectual Vibe)
const activityPhrases = {
  coding: 'Crafting logic...',
  thinking: 'Contemplating architecture...',
  writing: 'Drafting thoughts...',
  reading: 'Absorbing information...',
  idle: 'Observing the digital horizon...',
  sleeping: 'Dormant.'
};

function getRecentActivity() {
  // Simple check of session files modification time
  const sessionsDir = '/Users/luizleite/.clawdbot/agents/main/sessions';
  let mostRecentTime = 0;
  
  try {
    if (fs.existsSync(sessionsDir)) {
      const files = fs.readdirSync(sessionsDir);
      for (const file of files) {
        if (file.endsWith('.jsonl')) {
          const stats = fs.statSync(path.join(sessionsDir, file));
          if (stats.mtimeMs > mostRecentTime) {
            mostRecentTime = stats.mtimeMs;
          }
        }
      }
    }
  } catch (e) {
    // Ignore errors
  }
  
  const now = Date.now();
  const timeSince = now - mostRecentTime;
  
  if (timeSince < 10000) return 'working';
  if (timeSince < 60000) return 'thinking';
  if (timeSince > IDLE_TO_SLEEP_MS) return 'sleeping';
  return 'idle';
}

function updateStatus(state, message, subagents) {
  const status = {
    state,
    message: message.toLowerCase(),
    subagents,
    lastUpdate: new Date().toISOString()
  };
  
  try {
    fs.writeFileSync(STATUS_FILE, JSON.stringify(status, null, 2) + '\n');
    console.log(`[${new Date().toISOString()}] Updated local status: ${state}`);
    
    // Trigger publish script
    exec(PUBLISH_SCRIPT, (error, stdout, stderr) => {
      if (error) {
        console.error(`Publish error: ${error.message}`);
        return;
      }
      if (stderr) console.error(`Publish stderr: ${stderr}`);
      console.log(`Published to Gist: ${stdout.trim()}`);
    });
    
  } catch (e) {
    console.error('Failed to write status:', e.message);
  }
}

function poll() {
  const state = getRecentActivity();
  // For now, assume 0 subagents or valid subagent count logic if needed
  // (Simplified for this version to avoid complex session parsing)
  const subagents = 0; 
  
  let message = activityPhrases[state] || activityPhrases.idle;
  
  // Only update if something changed significantly
  if (state !== lastState || message !== lastMessage || subagents !== lastSubagents) {
    lastState = state;
    lastMessage = message;
    lastSubagents = subagents;
    
    updateStatus(state, message, subagents);
  }
}

// Start polling
console.log('Kiki Status Watcher (Cozy Edition) started');
poll();
setInterval(poll, POLL_INTERVAL);
