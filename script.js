// Kiki Companion - Web Interface
// Connects to status.json for real-time updates

class KikiCompanion {
    constructor() {
        this.state = 'idle';
        this.subagents = 0;
        this.message = '';
        this.statusUrl = './status.json';
        this.pollInterval = 3000;
        
        this.elements = {
            body: document.body,
            statusText: document.querySelector('.status-text'),
            subagentsIndicator: document.querySelector('.subagents-indicator'),
            message: document.querySelector('.message'),
            pupils: document.querySelectorAll('.pupil'),
            connectionDot: null
        };
        
        this.init();
    }
    
    init() {
        this.createConnectionIndicator();
        this.setupMouseTracking();
        this.startPolling();
        this.setState('idle');
    }
    
    createConnectionIndicator() {
        const dot = document.createElement('div');
        dot.className = 'connection-indicator';
        document.body.appendChild(dot);
        this.elements.connectionDot = dot;
    }
    
    setupMouseTracking() {
        document.addEventListener('mousemove', (e) => {
            if (this.state === 'sleeping') return;
            
            this.elements.pupils.forEach(pupil => {
                const eye = pupil.parentElement;
                const rect = eye.getBoundingClientRect();
                const eyeCenterX = rect.left + rect.width / 2;
                const eyeCenterY = rect.top + rect.height / 2;
                
                const angle = Math.atan2(e.clientY - eyeCenterY, e.clientX - eyeCenterX);
                const distance = Math.min(12, Math.hypot(e.clientX - eyeCenterX, e.clientY - eyeCenterY) / 20);
                
                const x = Math.cos(angle) * distance;
                const y = Math.sin(angle) * distance;
                
                pupil.style.transform = `translate(${x}px, ${y}px)`;
            });
        });
    }
    
    setState(state) {
        this.state = state;
        this.elements.body.className = state;
        this.elements.statusText.textContent = this.getStatusText(state);
        this.updateBackgroundColor(state);
    }
    
    getStatusText(state) {
        const texts = {
            idle: 'idle',
            thinking: 'thinking...',
            working: 'working',
            sleeping: 'resting',
            subagent: 'delegating',
            disconnected: 'offline'
        };
        return texts[state] || state;
    }
    
    updateBackgroundColor(state) {
        const colors = {
            idle: '#1a1a2e',
            thinking: '#16213e',
            working: '#1f3a5f',
            sleeping: '#0f0f1a',
            subagent: '#2d4a3e',
            alert: '#4a2d2d',
            disconnected: '#2a1a1a'
        };
        document.body.style.backgroundColor = colors[state] || colors.idle;
    }
    
    updateSubagents(count) {
        this.subagents = count;
        this.elements.subagentsIndicator.innerHTML = '';
        
        for (let i = 0; i < count; i++) {
            const dot = document.createElement('div');
            dot.className = 'subagent-dot active';
            dot.style.animationDelay = `${i * 0.2}s`;
            this.elements.subagentsIndicator.appendChild(dot);
        }
        
        if (count > 0 && this.state !== 'working') {
            this.setState('subagent');
        }
    }
    
    showMessage(text) {
        if (!text) {
            this.elements.message.classList.remove('visible');
            return;
        }
        this.elements.message.textContent = text;
        this.elements.message.classList.add('visible');
    }
    
    setConnected(connected) {
        if (this.elements.connectionDot) {
            this.elements.connectionDot.classList.toggle('connected', connected);
            this.elements.connectionDot.classList.toggle('disconnected', !connected);
        }
    }
    
    async startPolling() {
        const poll = async () => {
            try {
                const response = await fetch(this.statusUrl + '?t=' + Date.now());
                if (!response.ok) throw new Error('Status fetch failed');
                
                const data = await response.json();
                this.setConnected(true);
                
                // Update state
                if (data.state) {
                    this.setState(data.state);
                }
                
                // Update subagents
                if (typeof data.subagents === 'number') {
                    this.updateSubagents(data.subagents);
                }
                
                // Update message
                this.showMessage(data.message || '');
                
                // Check staleness (if no update in 2 minutes, show as idle)
                if (data.lastUpdate) {
                    const lastUpdate = new Date(data.lastUpdate);
                    const now = new Date();
                    const diffMinutes = (now - lastUpdate) / 1000 / 60;
                    
                    if (diffMinutes > 2 && this.state !== 'idle') {
                        this.setState('idle');
                        this.showMessage('');
                    }
                }
                
            } catch (e) {
                this.setConnected(false);
                // Don't change state on error, just show disconnected indicator
            }
        };
        
        // Initial poll
        await poll();
        
        // Continue polling
        setInterval(poll, this.pollInterval);
    }
}

// Initialize
const kiki = new KikiCompanion();

// Expose for console testing
window.kiki = kiki;
