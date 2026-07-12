document.addEventListener('DOMContentLoaded', () => {
    
    const loadingScreen = document.getElementById('loading-screen');
    const loadingProgress = document.getElementById('loading-progress');
    
    let isAtEndState = false;
    const canvas = document.getElementById('sequence-canvas');

    // Custom Cursor & Interaction Logic
    const cursorDot = document.getElementById('cursor-dot');
    const cursorRing = document.getElementById('cursor-ring');
    let mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let ringPos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

    // Parallax Targets
    const parallaxElements = document.querySelectorAll('.parallax-target');
    const parallaxState = Array.from(parallaxElements).map(() => ({ x: 0, y: 0 }));

    if (cursorDot && cursorRing) {
        window.addEventListener('mousemove', (e) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
            
            // Instantly move dot
            cursorDot.style.transform = `translate(${mouse.x}px, ${mouse.y}px) translate(-50%, -50%)`;
        }, { passive: true });

        const renderLoop = () => {
            // Lerp cursor ring
            ringPos.x += (mouse.x - ringPos.x) * 0.15;
            ringPos.y += (mouse.y - ringPos.y) * 0.15;
            cursorRing.style.transform = `translate(${ringPos.x}px, ${ringPos.y}px) translate(-50%, -50%)`;

            // Lerp Parallax Elements
            // Calculate mouse offset from center (-1 to 1)
            const cx = (mouse.x / window.innerWidth) * 2 - 1;
            const cy = (mouse.y / window.innerHeight) * 2 - 1;

            parallaxElements.forEach((el, index) => {
                const speed = parseFloat(el.getAttribute('data-speed') || 0.05);
                const targetX = cx * speed * 100;
                const targetY = cy * speed * 100;

                parallaxState[index].x += (targetX - parallaxState[index].x) * 0.08;
                parallaxState[index].y += (targetY - parallaxState[index].y) * 0.08;

                // Only apply parallax if we haven't scrolled, otherwise it overrides the scatter effect!
                if (window.scrollY < 10) {
                    el.style.transform = `translate(${parallaxState[index].x}px, ${parallaxState[index].y}px)`;
                }
            });

            requestAnimationFrame(renderLoop);
        };
        requestAnimationFrame(renderLoop);

        // Hover states for cursor
        document.querySelectorAll('.magnetic-target, .nav-logo, .canvas-clickable').forEach(el => {
            el.addEventListener('mouseenter', () => cursorRing.classList.add('hovering'));
            el.addEventListener('mouseleave', () => cursorRing.classList.remove('hovering'));
        });

        // Magnetic Button Logic
        const magneticButtons = document.querySelectorAll('.cta-primary');
        magneticButtons.forEach(btn => {
            btn.addEventListener('mousemove', (e) => {
                const rect = btn.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                
                btn.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
                
                const text = btn.querySelector('.btn-text');
                const icon = btn.querySelector('.btn-icon');
                if(text) text.style.transform = `translate(${x * 0.1}px, ${y * 0.1}px)`;
                if(icon) icon.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
            });

            btn.addEventListener('mouseleave', () => {
                btn.style.transform = `translate(0px, 0px)`;
                const text = btn.querySelector('.btn-text');
                const icon = btn.querySelector('.btn-icon');
                if(text) text.style.transform = `translate(0px, 0px)`;
                if(icon) icon.style.transform = `translate(0px, 0px)`;
            });
        });

        // Portrait Hover Glow
        const portrait = document.querySelector('.hero-portrait');
        const heroGlow = document.querySelector('.hero-glow');
        if(portrait && heroGlow) {
            portrait.addEventListener('mouseenter', () => {
                heroGlow.style.opacity = '1';
                heroGlow.style.transform = `translate(-50%, -50%) scale(1.1)`;
            });
            portrait.addEventListener('mouseleave', () => {
                heroGlow.style.opacity = '0.5';
                heroGlow.style.transform = `translate(-50%, -50%) scale(1)`;
            });
        }
    }

    // Fake Premium Loading Sequence
    const loadingBarFill = document.getElementById('loading-bar-fill');
    const portfolioHero = document.getElementById('portfolio-content');
    
    let progress = 0;
    const loadingInterval = setInterval(() => {
        // Fast random increments to feel "crazy" and tech-y but polished
        progress += Math.floor(Math.random() * 8) + 2;
        if (progress > 100) progress = 100;
        
        if (loadingProgress) loadingProgress.textContent = progress;
        if (loadingBarFill) loadingBarFill.style.width = `${progress}%`;
        
        if (progress === 100) {
            clearInterval(loadingInterval);
            
            setTimeout(() => {
                loadingScreen.classList.add('fade-out');
                
                // Allow display to settle before triggering hero animation
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                    portfolioHero.classList.add('visible');
                }, 800); // matches the transition time of fade-out
                
            }, 300); // tiny pause at 100%
        }
    }, 40); // very fast update interval

    // ==================================================
    // CERTIFICATE SCROLL PATHS
    // ==================================================
    const certTimeline = document.getElementById('cert-timeline');
    const certImgs = document.querySelectorAll('.cert-path');
    
    window.addEventListener('scroll', () => {
        if (!certTimeline || !portfolioHero.classList.contains('visible')) return;
        
        // Find how far we are scrolled into certTimeline
        const rect = certTimeline.getBoundingClientRect();
        
        // We have 400vh of "scrollable" track since the sticky view is 100vh.
        const scrollDistance = certTimeline.offsetHeight - window.innerHeight;
        
        // Calculate progress (0 to 1) only when the timeline is active
        let progress = 0;
        if (rect.top <= 0) {
            progress = Math.abs(rect.top) / scrollDistance;
        }
        
        progress = Math.min(Math.max(progress, 0), 1);
        
        // If we haven't reached the timeline, don't update to save performance
        if (rect.top > window.innerHeight) return;

        // Animate certificates along a path based on progress
        certImgs.forEach((img, index) => {
             const delay = parseFloat(img.getAttribute('data-delay') || 0);
             
             // Guarantee that all certificates finish their animation exactly at progress = 1.0
             let startProgress = delay * 0.4; // They start staggering up to 32% of the scroll
             let localProgress = (progress - startProgress) / (1 - startProgress);
             localProgress = Math.min(Math.max(localProgress, 0), 1);
             
             // Start scattered randomly around the screen edges (deterministic based on index)
             // Using window dimensions so they start completely off-screen
             let startX = (index % 2 === 0 ? 1 : -1) * (window.innerWidth * 0.4 + index * 50);
             let startY = window.innerHeight * 1.2 + (index * 100);
             let startR = (index % 2 === 0 ? 1 : -1) * (15 + index * 5);
             
             // Final settled coordinates for a perfect 3x2 Grid
             let finalX = 0;
             let finalY = 0;
             let finalR = (index % 2 === 0 ? 1 : -1) * 2; // Very clean, minimal tilt
             
             let gridSlot = 0;
             if (img.classList.contains('lokyu-cert')) gridSlot = 1; // Top Middle
             else if (img.classList.contains('bangalore-cert')) gridSlot = 2; // Top Right
             else if (index === 0) gridSlot = 0; // Top Left
             else if (index === 1) gridSlot = 3; // Bottom Left
             else if (index === 2) gridSlot = 4; // Bottom Middle
             else if (index === 3) gridSlot = 5; // Bottom Right
             
             // Use viewport units (vw/vh) for responsive, non-overlapping spacing
             let colIndex = gridSlot % 3; // 0, 1, or 2
             let rowIndex = Math.floor(gridSlot / 3); // 0 or 1
             
             // finalX: -28vw, 0vw, 28vw (ensures they spread evenly across screen width)
             finalX = (colIndex - 1) * (window.innerWidth * 0.28); 
             // finalY: -18vh, 18vh
             finalY = rowIndex === 0 ? -(window.innerHeight * 0.18) : (window.innerHeight * 0.18);
             
             // Interpolate position and rotation using an ease-out curve
             let easeOut = 1 - Math.pow(1 - localProgress, 3);
             
             let currentX = startX + (finalX - startX) * localProgress;
             let currentY = startY + (finalY - startY) * easeOut;
             let currentR = startR + (finalR - startR) * easeOut;
             
             // Subside the floating effect completely when they settle so they form a perfect, still grid
             let floatIntensity = 1 - easeOut; 
             let floatWave = Math.sin((Date.now() * 0.002) + delay) * 15 * floatIntensity;
             
             // Scale handling
             let scale = img.classList.contains('priority-cert') ? 1.0 : 0.8;
             scale *= Math.min(easeOut + 0.5, 1); 
             
             img.style.transform = `translate(calc(-50% + ${currentX}px), calc(-50% + ${currentY + floatWave}px)) rotate(${currentR}deg) scale(${scale})`;
             
             // Fade in smoothly
             img.style.opacity = Math.min(localProgress * 4, 1);
        });
    });

});
