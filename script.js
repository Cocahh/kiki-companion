class FlavorEngine {
    constructor() {
        this.vocabulary = {
            coding: [
                "Crafting logic...",
                "Refining the architecture...",
                "Weaving digital threads...",
                "Optimizing patterns...",
                "structuring thoughts into code...",
                "Building robust systems..."
            ],
            thinking: [
                "Contemplating...",
                "Analyzing possibilities...",
                "Connecting abstract concepts...",
                "Deep in thought...",
                "Simulating outcomes...",
                "Reviewing context..."
            ],
            writing: [
                "Drafting response...",
                "Curating words...",
                "Expressing ideas...",
                "Synthesizing information...",
                "Composing narrative..."
            ],
            reading: [
                "Absorbing knowledge...",
                "Reading context...",
                "Understanding nuance...",
                "Parsing details...",
                "Scanning for insights..."
            ],
            idle: [
                "Observing...",
                "At rest...",
                "Waiting for inspiration...",
                "Mindful presence...",
                "Ready to assist..."
            ]
        };
    }

    generate(rawMessage, state) {
        if (!rawMessage || rawMessage.length < 3) return { title: this.pick(this.vocabulary.idle), detail: "" };

        const lower = rawMessage.toLowerCase();
        let title = "Processing...";
        
        if (lower.includes("code") || lower.includes("function") || lower.includes("script") || lower.includes("dev")) {
            title = this.pick(this.vocabulary.coding);
        } else if (lower.includes("think") || lower.includes("plan") || lower.includes("wonder")) {
            title = this.pick(this.vocabulary.thinking);
        } else if (lower.includes("writ") || lower.includes("typ") || lower.includes("draft")) {
            title = this.pick(this.vocabulary.writing);
        } else if (lower.includes("read") || lower.includes("look") || lower.includes("check")) {
            title = this.pick(this.vocabulary.reading);
        } else if (state === 'idle') {
            title = this.pick(this.vocabulary.idle);
        }

        // Return title (Flavor) and detail (Original Message, cleaned up)
        return {
            title: title,
            detail: rawMessage
        };
    }

    pick(array) {
        return array[Math.floor(Math.random() * array.length)];
    }
}

class KikiCompanion {
    constructor() {
        this.state = 'idle';
        this.flavor = new FlavorEngine();
        // Use the RAW gist URL to bypass caching issues (though raw is usually cached for ~5 mins)
        // Adding a timestamp query param helps bust cache on fetch
        this.remoteUrl = 'https://gist.githubusercontent.com/Cocahh/2231eed9bd7e74a78eaa27e08764ee11/raw/kiki-status.json';
        this.pollInterval = 5000; // Poll every 5 seconds (GitHub rate limits are high for raw, but let's be polite)
        
        this.elements = {
            body: document.body,
            statusLabel: document.querySelector('.status-label'),
            mainMessage: document.querySelector('.main-message'),
            flavorText: document.querySelector('.flavor-text'),
            subagentsContainer: document.querySelector('.subagents-container'),
            connectionText: document.querySelector('.connection-text'),
            statusDot: document.querySelector('.status-dot'),
            pulseRing: document.querySelector('.pulse-ring')
        };
        
        this.init();
    }
    
    init() {
        this.startPolling();
    }
    
    updateVisuals(state, message, subagents) {
        // 1. Update State on Body (for CSS themes)
        this.elements.body.setAttribute('data-state', state);
        
        // 2. Generate Flavor Text
        const { title, detail } = this.flavor.generate(message, state);
        
        // 3. Update Text Content
        // If message is very short/empty, use the flavor title as the main message
        if (message.length < 5) {
             this.elements.mainMessage.textContent = title;
             this.elements.flavorText.textContent = "";
        } else {
             // Otherwise: Flavor as main, Real message as detail
             this.elements.mainMessage.textContent = title;
             this.elements.flavorText.textContent = detail;
        }

        // 4. Update Status Label
        this.elements.statusLabel.textContent = state.toUpperCase();
        
        // 5. Render Subagents
        this.renderSubagents(subagents);
    }
    
    renderSubagents(count) {
        this.elements.subagentsContainer.innerHTML = '';
        if (count > 0) {
            for (let i = 0; i < count; i++) {
                const dot = document.createElement('div');
                dot.className = 'agent-dot active';
                this.elements.subagentsContainer.appendChild(dot);
            }
        }
    }
    
    async startPolling() {
        const poll = async () => {
            try {
                // Fetch with cache busting
                const response = await fetch(`${this.remoteUrl}?t=${Date.now()}`);
                
                if (!response.ok) throw new Error('Fetch failed');
                
                const data = await response.json();
                
                this.updateVisuals(data.state || 'idle', data.message || '', data.subagents || 0);
                this.setConnected(true);
                
            } catch (e) {
                console.error("Polling error:", e);
                this.setConnected(false);
            }
        };
        
        setInterval(poll, this.pollInterval);
        poll(); // Initial call
    }
    
    setConnected(isConnected) {
        if (isConnected) {
            this.elements.connectionText.textContent = "Synced";
            this.elements.connectionText.style.opacity = "0.5";
        } else {
            this.elements.connectionText.textContent = "Offline";
            this.elements.connectionText.style.opacity = "1";
        }
    }
}

// Initialize
window.kiki = new KikiCompanion();
