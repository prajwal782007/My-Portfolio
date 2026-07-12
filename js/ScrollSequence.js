class ScrollSequence {
    constructor(options) {
        this.canvas = document.getElementById(options.canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.scrollContainer = document.getElementById(options.containerId);
        
        this.totalFrames = options.totalFrames || 205;
        // Using the original path as requested relative to the project root
        this.basePath = options.basePath || 'Dashboard/ezgif-5a692db2efb50be2-jpg/ezgif-frame-';
        this.extension = options.extension || '.jpg';
        
        this.images = [];
        this.loadedImages = new Set();
        
        this.currentFrame = 0;
        this.targetFrame = 0;
        this.isReady = false;
        
        this.onFirstFrameLoad = options.onFirstFrameLoad || (() => {});
        this.onProgress = options.onProgress || (() => {});
        this.onScrollEnd = options.onScrollEnd || (() => {});
        
        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        // Load frame 0 (index 1 visually but we use 0-based array)
        this.loadFrame(0).then(() => {
            this.isReady = true;
            this.drawFrame(0);
            this.onFirstFrameLoad();
            this.startPreloading();
        });

        // Setup scroll listener mapping
        window.addEventListener('scroll', () => this.onScroll(), { passive: true });
        
        // Start animation loop
        this.renderLoop();
    }

    getPaddedNumber(index) {
        return (index + 1).toString().padStart(3, '0');
    }

    getFrameUrl(index) {
        return `${this.basePath}${this.getPaddedNumber(index)}${this.extension}`;
    }

    loadFrame(index) {
        return new Promise((resolve, reject) => {
            if (this.images[index]) {
                resolve(this.images[index]);
                return;
            }

            const img = new Image();
            img.onload = () => {
                this.images[index] = img;
                this.loadedImages.add(index);
                resolve(img);
            };
            img.onerror = reject;
            img.src = this.getFrameUrl(index);
        });
    }

    async startPreloading() {
        // Progressive loading: we load a few frames ahead, then the rest
        // We load them sequentially to avoid killing browser network queue
        let loadedCount = 1;
        
        for (let i = 1; i < this.totalFrames; i++) {
            try {
                await this.loadFrame(i);
                loadedCount++;
                const progress = Math.round((loadedCount / this.totalFrames) * 100);
                this.onProgress(progress);
            } catch (e) {
                console.error(`Failed to load frame ${i}`, e);
            }
        }
    }

    resize() {
        // Device pixel ratio for high DPI screens
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.parentElement.getBoundingClientRect();
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        
        this.ctx.scale(dpr, dpr);
        
        // Logical width/height
        this.canvas.style.width = `${rect.width}px`;
        this.canvas.style.height = `${rect.height}px`;
        
        if (this.isReady) {
            this.drawFrame(Math.round(this.currentFrame));
        }
    }

    onScroll() {
        // Calculate scroll progress for the container
        const rect = this.scrollContainer.getBoundingClientRect();
        
        // rect.top is 0 when container top hits viewport top.
        // It goes negative as we scroll down.
        // Total scrollable distance is container height - viewport height
        const maxScroll = rect.height - window.innerHeight;
        
        // current scroll position relative to container
        let scrollPos = -rect.top;
        
        // Clamp between 0 and maxScroll
        scrollPos = Math.max(0, Math.min(scrollPos, maxScroll));
        
        let progress = scrollPos / maxScroll;
        
        // Map to frame index
        this.targetFrame = progress * (this.totalFrames - 1);
        
        // Check if at the end
        if (progress > 0.99) {
            this.onScrollEnd(true);
        } else {
            this.onScrollEnd(false);
        }
    }

    drawFrame(index) {
        // If exact frame isn't loaded, find the closest loaded frame to avoid blank canvas
        let frameToDraw = index;
        if (!this.loadedImages.has(frameToDraw)) {
            // Find closest
            let minDiff = Infinity;
            for (let loaded of this.loadedImages) {
                const diff = Math.abs(loaded - index);
                if (diff < minDiff) {
                    minDiff = diff;
                    frameToDraw = loaded;
                }
            }
        }

        const img = this.images[frameToDraw];
        if (!img) return; // Should not happen since frame 0 is always loaded

        const canvasWidth = this.canvas.width / (window.devicePixelRatio || 1);
        const canvasHeight = this.canvas.height / (window.devicePixelRatio || 1);

        // object-fit: cover logic
        const scale = Math.max(canvasWidth / img.width, canvasHeight / img.height);
        
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;
        
        // Center the image
        const x = (canvasWidth - scaledWidth) / 2;
        const y = (canvasHeight - scaledHeight) / 2;

        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        // Use image smoothing for better quality
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        
        this.ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
    }

    renderLoop() {
        // Interpolate for smooth animation
        // 0.15 gives a tight but smooth feeling
        const diff = this.targetFrame - this.currentFrame;
        
        if (Math.abs(diff) > 0.01) {
            this.currentFrame += diff * 0.15;
            this.drawFrame(Math.round(this.currentFrame));
        } else {
            // Snap to exact when very close
            if (this.currentFrame !== this.targetFrame) {
                this.currentFrame = this.targetFrame;
                this.drawFrame(Math.round(this.currentFrame));
            }
        }
        
        requestAnimationFrame(() => this.renderLoop());
    }
}
