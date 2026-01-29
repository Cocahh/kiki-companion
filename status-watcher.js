#!/usr/bin/env node
// Kiki Status Watcher
// Monitors Clawdbot gateway sessions and updates status.json in real-time

const http = require('http');
const fs = require('fs');
const path = require('path');

const STATUS_FILE = '/Users/luizleite/clawd/kiki-companion/status.json';
const GATEWAY_URL = 'http://localhost:18789';
const GATEWAY_TOKEN = 'ef98d90c7dd5caa876f99794c53a73ce34b23b05f12e0591';
const POLL_INTERVAL = 2000; // 2 seconds
const IDLE_TO_SLEEP_MS = 5 * 60 * 1000; // 5 minutes

let lastActiveTime = Date.now();
let currentState = 'idle';

// Phrases for different activities
const activityPhrases = {
  discord: 'chatting on discord',
  telegram: 'messaging on telegram',
  whatsapp: 'replying on whatsapp',
  slack: 'working in slack',
  imessage: 'sending imessage',
  default: 'working on something'
};

async function fetchSessions() {
  return new Promise((resolve, reject) => {
    const url = new URL('/api/sessions', GATEWAY_URL);
    
    const req = http.request(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${GATEWAY_TOKEN}`,
        'Accept': 'application/json'
      },
      timeout: 3000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          // Gateway might return HTML for web UI, try to parse JSON
          if (data.startsWith('{') || data.startsWith('[')) {
            resolve(JSON.parse(data));
          } else {
            resolve(null);
          }
        } catch (e) {
          resolve(null);
        }
      });
    });
    
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
    req.end();
  });
}

async function getSessionStatus() {
  // Use the internal sessions list command via a temp file approach
  // Since we can't easily call the gateway API, we'll check recent file activity
  
  const transcriptDir = '/Users/luizleite/.clawdbot/agents/main/sessions';
  
  try {
    const files = fs.readdirSync(transcriptDir);
    const jsonlFiles = files.filter(f => f.endsWith('.jsonl'));
    
    let mostRecent = null;
    let mostRecentTime = 0;
    
    for (const file of jsonlFiles) {
      const stat = fs.statSync(path.join(transcriptDir, file));
      if (stat.mtimeMs > mostRecentTime) {
        mostRecentTime = stat.mtimeMs;
        mostRecent = file;
      }
    }
    
    const now = Date.now();
    const timeSinceActivity = now - mostRecentTime;
    
    // Check if there's recent activity (last 10 seconds = likely working)
    if (timeSinceActivity < 10000) {
      lastActiveTime = now;
      return { state: 'working', timeSinceActivity };
    }
    
    // Check if thinking (10-30 seconds since last activity during a conversation)
    if (timeSinceActivity < 30000) {
      return { state: 'thinking', timeSinceActivity };
    }
    
    // Otherwise idle
    return { state: 'idle', timeSinceActivity };
    
  } catch (e) {
    return { state: 'idle', timeSinceActivity: Infinity };
  }
}

function countSubAgents() {
  // Check for active sub-agent sessions by looking at session files
  const sessionsDir = '/Users/luizleite/.clawdbot/agents/main/sessions';
  
  try {
    if (!fs.existsSync(sessionsDir)) return 0;
    
    const sessionsFile = path.join(sessionsDir, 'sessions.json');
    if (!fs.existsSync(sessionsFile)) return 0;
    
    const sessions = JSON.parse(fs.readFileSync(sessionsFile, 'utf8'));
    
    // Count sessions that are sub-agents (spawned sessions)
    let subagentCount = 0;
    const now = Date.now();
    
    for (const [key, session] of Object.entries(sessions)) {
      if (key.includes(':spawn:') || key.includes(':sub:')) {
        // Check if recently active (last 5 minutes)
        if (session.updatedAt && (now - session.updatedAt) < 5 * 60 * 1000) {
          subagentCount++;
        }
      }
    }
    
    return subagentCount;
  } catch (e) {
    return 0;
  }
}

function getActivityMessage(state, channel) {
  if (state === 'sleeping') return 'zzz...';
  if (state === 'idle') return '';
  if (state === 'thinking') return 'hmm...';
  
  return activityPhrases[channel] || activityPhrases.default;
}

function updateStatus(state, message, subagents) {
  const status = {
    state,
    message,
    subagents,
    lastUpdate: new Date().toISOString()
  };
  
  try {
    fs.writeFileSync(STATUS_FILE, JSON.stringify(status, null, 2) + '\n');
  } catch (e) {
    console.error('Failed to write status:', e.message);
  }
}

async function poll() {
  const sessionStatus = await getSessionStatus();
  const subagents = countSubAgents();
  
  let state = sessionStatus.state;
  let message = '';
  
  // Determine final state
  if (state === 'working' || state === 'thinking') {
    lastActiveTime = Date.now();
    message = getActivityMessage(state, 'discord'); // TODO: detect actual channel
  } else {
    // Check if should sleep
    const idleTime = Date.now() - lastActiveTime;
    if (idleTime > IDLE_TO_SLEEP_MS) {
      state = 'sleeping';
      message = 'zzz...';
    }
  }
  
  // Sub-agents override to show delegation
  if (subagents > 0 && state !== 'sleeping') {
    state = 'working';
    message = `delegating to ${subagents} helper${subagents > 1 ? 's' : ''}`;
  }
  
  // Only update if state changed
  if (state !== currentState || subagents > 0) {
    currentState = state;
    updateStatus(state, message, subagents);
    console.log(`[${new Date().toISOString()}] State: ${state}, Subagents: ${subagents}, Message: ${message}`);
  }
}

// Start polling
console.log('Kiki Status Watcher started');
console.log(`Monitoring: ${STATUS_FILE}`);
console.log(`Poll interval: ${POLL_INTERVAL}ms`);

poll(); // Initial poll
setInterval(poll, POLL_INTERVAL);
