// Kiki Companion - Web Interface
// Connects to Clawdbot Gateway for real-time status

class KikiCompanion {
    constructor() {
        this.state = 'idle'; // idle, thinking, working, sleeping
        this.subagents = 0;
        this.message = '';
        this.gatewayUrl = 'http://localhost:18789';
        this.gatewayToken = null;
        
        this.elements = {
            body: document.body,
            statusText: document.querySelector('.status-text'),
            subagentsIndicator: document.querySelector('.subagents-indicator'),
            message: document.querySelector('.message'),
            pupils: document.querySelectorAll('.pupil')
        };
        
        this.init();
    }
    
    init() {
        this.setupMouseTracking();
        this.startPolling();
        this.setState('idle');
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
            subagent: 'delegating'
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
            alert: '#4a2d2d'
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
        
        if (count > 0) {
            this.setState('subagent');
        }
    }
    
    showMessage(text) {
        this.elements.message.textContent = text;
        this.elements.message.classList.add('visible');
        
        setTimeout(() => {
            this.elements.message.classList.remove('visible');
        }, 5000);
    }
    
    async startPolling() {
        // Poll gateway for status updates
        setInterval(async () => {
            try {
                await this.pollStatus();
            } catch (e) {
                // Gateway not available, stay idle
            }
        }, 2000);
    }
    
    async pollStatus() {
        // TODO: Connect to actual Clawdbot Gateway API
        // For now, simulate states for demo
        
        // This would normally fetch from:
        // GET /api/sessions/list to check active sessions
        // GET /api/sessions/{id}/status for detailed status
    }
    
    // Manual controls for testing
    demo() {
        const states = ['idle', 'thinking', 'working', 'sleeping'];
        let i = 0;
        
        setInterval(() => {
            this.setState(states[i % states.length]);
            i++;
        }, 3000);
    }
}

// Initialize
const kiki = new KikiCompanion();

// Expose for console testing
window.kiki = kiki;

// Demo mode - uncomment to test states
// kiki.demo();
