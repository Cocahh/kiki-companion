class FlavorEngine {
    constructor() {
        this.prefixes = [
            "⚡ SYSTEM:",
            "» ALERT:",
            "★ UPDATE:",
            "⟳ PROCESS:",
            "◈ STATUS:"
        ];
        
        this.vocabulary = {
            coding: [
                "weaving digital spells", 
                "restructuring logic gates", 
                "optimizing the matrix", 
                "compiling neural thoughts", 
                "injecting code fragments",
                "refactoring reality",
                "debug_mode::engaged",
                "synchronizing syntax"
            ],
            thinking: [
                "analyzing vectors", 
                "querying deep memory", 
                "calculating probabilities", 
                "traversing decision trees", 
                "simulating outcomes",
                "navigating latent space",
                "pondering existence",
                "running cognitive cycles"
            ],
            writing: [
                "encoding linguistic data", 
                "transcribing thoughts", 
                "generating narrative structures", 
                "serializing output",
                "manifesting words",
                "streaming text buffer"
            ],
            reading: [
                "ingesting data streams", 
                "parsing input", 
                "absorbing context", 
                "scanning external logs",
                "decoding visual input"
            ],
            error: [
                "detecting anomalies", 
                "recalibrating sensors", 
                "fixing quantum entanglements"
            ],
            idle: [
                "awaiting input", 
                "monitoring system vitals", 
                "standby mode active", 
                "observing timeline",
                "idle cycles: 99%"
            ]
        };
    }

    generate(rawMessage, state) {
        // If raw message is too short, just return it stylized
        if (!rawMessage || rawMessage.length < 3) return this.vocabulary.idle[0];

        const lower = rawMessage.toLowerCase();
        let flavor = rawMessage;

        // Simple keyword matching for flavor replacement
        // We actually want to KEEP the user's message but maybe prefix/suffix it or show a cool "Action" title
        
        // Strategy: Return an object { title, detail }
        // Title is the "Vibe", Detail is the raw message stylized
        
        let vibe = "PROCESSING";
        
        if (lower.includes("code") || lower.includes("function") || lower.includes("script") || lower.includes("dev")) {
            vibe = this.pick(this.vocabulary.coding);
        } else if (lower.includes("think") || lower.includes("plan") || lower.includes("wonder")) {
            vibe = this.pick(this.vocabulary.thinking);
        } else if (lower.includes("writ") || lower.includes("typ") || lower.includes("draft")) {
            vibe = this.pick(this.vocabulary.writing);
        } else if (lower.includes("read") || lower.includes("look") || lower.includes("check")) {
            vibe = this.pick(this.vocabulary.reading);
        } else if (state === 'idle') {
            vibe = this.pick(this.vocabulary.idle);
        }

        return {
            title: vibe,
            detail: rawMessage.toLowerCase()
        };
    }

    pick(array) {
        return array[Math.floor(Math.random() * array.length)];
    }
}

class Typewriter {
    constructor(element) {
        this.element = element;
        this.queue = [];
        this.isTyping = false;
        this.currentText = "";
    }

    type(text, speed = 30) {
        // If it's the same text, don't retype
        if (text === this.currentText) return;
        this.currentText = text;
        
        // Clear existing interval if any (hard reset for new message)
        if (this.timer) clearInterval(this.timer);
        
        this.element.textContent = "";
        let i = 0;
        
        this.timer = setInterval(() => {
            if (i < text.length) {
                this.element.textContent += text.charAt(i);
                i++;
            } else {
                clearInterval(this.timer);
            }
        }, speed);
    }
}

class KikiCompanion {
    constructor() {
        this.state = 'idle';
        this.flavor = new FlavorEngine();
        this.localUrl = 'http://localhost:3847/status';
        this.fallbackUrl = './status.json';
        this.pollInterval = 1000;
        
        this.elements = {
            body: document.body,
            statusBadge: document.querySelector('.status-badge'),
            message: document.querySelector('.message'),
            subMessage: document.querySelector('.sub-message'),
            pupils: document.querySelectorAll('.pupil'),
            eyesContainer: document.querySelector('.eyes-container'),
            connectionDot: document.querySelector('.dot'),
            connectionText: document.querySelector('.connection-status .text'),
            subagents: document.querySelector('.subagents')
        };
        
        this.typewriter = new Typewriter(this.elements.message);
        this.init();
    }
    
    init() {
        this.setupMouseTracking();
        this.startPolling();
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
                const distance = Math.min(15, Math.hypot(e.clientX - eyeCenterX, e.clientY - eyeCenterY) / 15);
                
                const x = Math.cos(angle) * distance;
                const y = Math.sin(angle) * distance;
                
                // Add a little robotic delay/smoothing in CSS, here just set target
                pupil.style.transform = `translate(${x}px, ${y}px)`;
            });
        });
    }
    
    updateVisuals(state, message, subagents) {
        // 1. Update State Attribute
        this.elements.body.setAttribute('data-state', state);
        
        // 2. Handle Flavor Text
        const { title, detail } = this.flavor.generate(message, state);
        
        // 3. Update Text Elements
        this.typewriter.type(title.toUpperCase());
        this.elements.subMessage.textContent = `>> ${detail}`;
        
        // 4. Update Badge
        this.elements.statusBadge.textContent = state.toUpperCase();
        
        // 5. Update Subagents
        this.renderSubagents(subagents);
        
        // 6. Eye Animations based on state
        this.updateEyeBehavior(state);
    }
    
    updateEyeBehavior(state) {
        const container = this.elements.eyesContainer;
        // Remove all animation classes first
        container.classList.remove('scanning', 'processing');
        
        if (state === 'working') {
            container.classList.add('scanning');
        } else if (state === 'thinking') {
            container.classList.add('processing');
        }
    }
    
    renderSubagents(count) {
        this.elements.subagents.innerHTML = '';
        for (let i = 0; i < count; i++) {
            const node = document.createElement('div');
            node.className = 'agent-node';
            node.style.animationDelay = `${i * 0.2}s`;
            this.elements.subagents.appendChild(node);
        }
    }
    
    async startPolling() {
        const poll = async () => {
            try {
                // Try local server first
                let response;
                try {
                    const controller = new AbortController();
                    const id = setTimeout(() => controller.abort(), 500);
                    response = await fetch(this.localUrl + '?t=' + Date.now(), { signal: controller.signal });
                    clearTimeout(id);
                } catch (e) {
                    // Fallback to file if server down (e.g. GitHub pages)
                    response = await fetch(this.fallbackUrl + '?t=' + Date.now());
                }

                if (!response.ok) throw new Error('Fetch failed');
                
                const data = await response.json();
                
                this.updateVisuals(data.state || 'idle', data.message || '', data.subagents || 0);
                this.setConnected(true);
                
            } catch (e) {
                console.error(e);
                this.setConnected(false);
            }
        };
        
        setInterval(poll, this.pollInterval);
        poll(); // Initial call
    }
    
    setConnected(isConnected) {
        if (isConnected) {
            this.elements.connectionDot.classList.add('connected');
            this.elements.connectionText.textContent = "LINK_ACTIVE";
        } else {
            this.elements.connectionDot.classList.remove('connected');
            this.elements.connectionText.textContent = "LINK_LOST";
            this.elements.body.setAttribute('data-state', 'offline');
        }
    }
}

// Initialize
window.kiki = new KikiCompanion();
