// Kiki Companion - Web Interface
// Polls local status server for real-time updates

class KikiCompanion {
    constructor() {
        this.state = 'idle';
        this.subagents = 0;
        this.message = '';
        this.localUrl = 'http://localhost:3847/status';
        this.fallbackUrl = './status.json';
        this.pollInterval = 1500; // 1.5 seconds for snappier updates
        this.useLocal = true;
        
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
        if (this.state === state) return;
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
        if (this.subagents === count) return;
        this.subagents = count;
        this.elements.subagentsIndicator.innerHTML = '';
        
        for (let i = 0; i < count; i++) {
            const dot = document.createElement('div');
            dot.className = 'subagent-dot active';
            dot.style.animationDelay = `${i * 0.2}s`;
            this.elements.subagentsIndicator.appendChild(dot);
        }
    }
    
    showMessage(text) {
        if (this.elements.message.textContent === text) return;
        if (!text) {
            this.elements.message.classList.remove('visible');
            this.elements.message.textContent = '';
            return;
        }
        this.elements.message.textContent = text;
        this.elements.message.classList.add('visible');
    }
    
    setConnected(connected, isLocal = false) {
        if (this.elements.connectionDot) {
            this.elements.connectionDot.classList.toggle('connected', connected);
            this.elements.connectionDot.classList.toggle('disconnected', !connected);
            this.elements.connectionDot.classList.toggle('local', isLocal);
        }
    }
    
    async fetchStatus(url) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2000);
        
        try {
            const response = await fetch(url + '?t=' + Date.now(), {
                signal: controller.signal
            });
            clearTimeout(timeout);
            if (!response.ok) throw new Error('Status fetch failed');
            return await response.json();
        } catch (e) {
            clearTimeout(timeout);
            throw e;
        }
    }
    
    async startPolling() {
        const poll = async () => {
            let data = null;
            let isLocal = false;
            
            // Try local first
            if (this.useLocal) {
                try {
                    data = await this.fetchStatus(this.localUrl);
                    isLocal = true;
                } catch (e) {
                    // Local failed, try fallback
                    this.useLocal = false;
                }
            }
            
            // Fallback to GitHub Pages
            if (!data) {
                try {
                    data = await this.fetchStatus(this.fallbackUrl);
                    // Re-enable local check periodically
                    setTimeout(() => { this.useLocal = true; }, 30000);
                } catch (e) {
                    this.setConnected(false);
                    return;
                }
            }
            
            this.setConnected(true, isLocal);
            
            // Update state
            if (data.state) {
                this.setState(data.state);
            }
            
            // Update subagents
            if (typeof data.subagents === 'number') {
                this.updateSubagents(data.subagents);
                if (data.subagents > 0 && data.state === 'idle') {
                    this.setState('subagent');
                }
            }
            
            // Update message
            this.showMessage(data.message || '');
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
