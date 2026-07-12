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

                // Only apply parallax if we haven't scrolled (to avoid overriding hero scatter effect)
                // OR if the element is inside the selected-work section which doesn't use scatter.
                if (window.scrollY < 10 || el.closest('.selected-work')) {
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
                    document.body.classList.remove('no-scroll');
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
             let finalR = 0; // Exactly 0 degrees for a perfectly straight layout
             
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
             
             // finalX: -32vw, 0vw, 32vw (increased to 32vw so priority certs don't overlap normal certs)
             finalX = (colIndex - 1) * (window.innerWidth * 0.32); 
             // finalY: shifted down slightly (+10vh) so they don't overlap the title at the top
             finalY = rowIndex === 0 ? -(window.innerHeight * 0.12) : (window.innerHeight * 0.32);
             
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

    // ==================================================
    // SELECTED WORK SECTION LOGIC
    // ==================================================
    const selectedWorkSection = document.getElementById('work');
    if (selectedWorkSection) {
        // Scroll Reveals
        const revealElements = document.querySelectorAll('.reveal-on-scroll');
        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });

        revealElements.forEach(el => revealObserver.observe(el));

        // Background color shifts per project
        const projectItems = document.querySelectorAll('.project-item');
        const bgColors = {
            'project-01': '#111216', // Cool charcoal
            'project-02': '#161412', // Warm neutral
            'project-03': '#121016', // Deep purple-ish dark
            'project-04': '#101214'  // Back to deep charcoal
        };

        const bgObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    let newBg = 'var(--bg-color)';
                    if (entry.target.classList.contains('project-01')) newBg = bgColors['project-01'];
                    if (entry.target.classList.contains('project-02')) newBg = bgColors['project-02'];
                    if (entry.target.classList.contains('project-03')) newBg = bgColors['project-03'];
                    if (entry.target.classList.contains('project-04')) newBg = bgColors['project-04'];
                    selectedWorkSection.style.backgroundColor = newBg;
                }
            });
        }, { threshold: 0.5 }); // Trigger when 50% of the project is visible

        projectItems.forEach(el => bgObserver.observe(el));

        // Extend Custom Cursor
        const customInteractives = document.querySelectorAll('.custom-cursor-hover, .custom-cursor-visual, .archive-link');
        customInteractives.forEach(el => {
            el.addEventListener('mouseenter', () => {
                if (cursorRing) cursorRing.classList.add('hovering');
            });
            el.addEventListener('mouseleave', () => {
                if (cursorRing) cursorRing.classList.remove('hovering');
            });
        });
    }

    // ==================================================
    // CERTIFICATE MODAL LOGIC
    // ==================================================
    const certModal = document.getElementById('cert-modal');
    const certModalImg = document.getElementById('cert-modal-img');
    const certModalClose = document.querySelector('.cert-modal-close');

    if (certModal && certModalImg && certModalClose) {
        certImgs.forEach(img => {
            // Hover logic for custom cursor
            img.addEventListener('mouseenter', () => {
                if (cursorRing) cursorRing.classList.add('hovering');
            });
            img.addEventListener('mouseleave', () => {
                if (cursorRing) cursorRing.classList.remove('hovering');
            });

            // Open modal on click
            img.addEventListener('click', () => {
                certModal.style.display = 'flex';
                // Tiny delay to ensure display: flex is applied before opacity transition
                setTimeout(() => {
                    certModal.classList.add('active');
                }, 10);
                certModalImg.src = img.src;
                certModalImg.alt = img.alt;
            });
        });

        const closeModal = () => {
            certModal.classList.remove('active');
            setTimeout(() => {
                certModal.style.display = 'none';
                certModalImg.src = ''; // Clear source so it doesn't flash old image next time
            }, 300); // Matches transition duration
        };

        certModalClose.addEventListener('click', closeModal);
        certModal.addEventListener('click', (e) => {
            // Close if clicking outside the image
            if (e.target === certModal) {
                closeModal();
            }
        });
    }

    // --- Project Details Modal Logic ---
    const readGridmindBtn = document.getElementById('read-gridmind-btn');
    const readCubesatBtn = document.getElementById('read-cubesat-btn');
    const aboutMeBtn = document.getElementById('about-me-btn');
    const projectModal = document.getElementById('project-details-modal');
    const projectModalClose = document.querySelector('.project-modal-close');
    const projectModalBackdrop = document.querySelector('.project-modal-backdrop');
    const projectModalBody = document.getElementById('project-details-body');

    if (projectModal) {
        const openProjectModal = (markdownText) => {
            projectModal.classList.add('show');
            document.body.style.overflow = 'hidden';

            try {
                const text = typeof markdownText !== 'undefined' ? markdownText : 'Markdown data not loaded.';
                
                let html = text
                    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
                    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
                    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/_(.*?)_/g, '<em>$1</em>')
                    .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
                    .replace(/^- (.*$)/gim, '<li>$1</li>')
                    .replace(/^---$/gim, '<hr>')
                    .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');

                html = html.replace(/(<li>.*<\/li>(\n<li>.*<\/li>)*)/gim, '<ul>$1</ul>');
                
                html = html.split('\n\n').map(p => {
                    if (p.trim() === '' || p.trim().startsWith('<')) return p;
                    return '<p>' + p.trim().replace(/\n/g, '<br>') + '</p>';
                }).join('\n\n');

                projectModalBody.innerHTML = html;
            } catch (error) {
                console.error(error);
                projectModalBody.innerHTML = '<p>Error parsing project details. Please try again.</p>';
            }
        };

        if (readGridmindBtn) {
            readGridmindBtn.addEventListener('click', () => {
                openProjectModal(typeof gridmindMarkdown !== 'undefined' ? gridmindMarkdown : undefined);
            });
        }
        
        if (readCubesatBtn) {
            readCubesatBtn.addEventListener('click', () => {
                openProjectModal(typeof cubesatMarkdown !== 'undefined' ? cubesatMarkdown : undefined);
            });
        }

        if (aboutMeBtn) {
            aboutMeBtn.addEventListener('click', () => {
                openProjectModal(typeof aboutMeMarkdown !== 'undefined' ? aboutMeMarkdown : undefined);
            });
        }

        const closeProjectModal = () => {
            projectModal.classList.remove('show');
            document.body.style.overflow = '';
        };

        if (projectModalClose) projectModalClose.addEventListener('click', closeProjectModal);
        if (projectModalBackdrop) projectModalBackdrop.addEventListener('click', closeProjectModal);
    }

    // --- Speech Player Logic ---
    const hearGridmindBtn = document.getElementById('hear-gridmind-btn');
    const hearCubesatBtn = document.getElementById('hear-cubesat-btn');
    const hearAboutMeBtn = document.getElementById('hear-about-me-btn');
    const speechWidget = document.getElementById('speech-player-widget');
    const closeSpeechBtn = document.getElementById('close-speech-btn');
    const gridmindAudio = document.getElementById('gridmind-audio');
    const cubesatAudio = document.getElementById('cubesat-audio');
    const aboutmeAudio = document.getElementById('aboutme-audio');
    const speechTextContainer = document.getElementById('speech-text');
    const speechTitle = document.querySelector('.speech-title');

    let currentAudio = null;

    if (speechWidget) {
        const playSpeech = (audioElement, titleText, speechTextData) => {
            if (currentAudio) {
                currentAudio.pause();
                currentAudio.currentTime = 0;
            }
            
            speechWidget.classList.add('show');
            if (speechTitle) speechTitle.textContent = titleText;
            
            if (speechTextData) {
                const formattedSpeech = speechTextData.split('\n\n').map(p => {
                    return `<p style="margin-bottom: 1rem;">${p}</p>`;
                }).join('');
                speechTextContainer.innerHTML = formattedSpeech;
            } else {
                speechTextContainer.innerHTML = '<p>Speech text not loaded.</p>';
            }

            if (audioElement) {
                currentAudio = audioElement;
                currentAudio.currentTime = 0;
                
                // Pause background videos to prevent overlapping audio and silent videos
                document.querySelectorAll('.scroll-autoplay-video').forEach(video => {
                    video.pause();
                });
                
                currentAudio.play().catch(e => console.log('Audio autoplay blocked:', e));
            }
        };

        if (hearGridmindBtn && gridmindAudio) {
            hearGridmindBtn.addEventListener('click', () => {
                playSpeech(gridmindAudio, 'Playing: GridMind-RL Overview', typeof gridmindSpeech !== 'undefined' ? gridmindSpeech : undefined);
            });
        }
        
        if (hearCubesatBtn && cubesatAudio) {
            hearCubesatBtn.addEventListener('click', () => {
                // Using cubesatMarkdown as text fallback for the speech widget
                playSpeech(cubesatAudio, 'Playing: Satellite Communication System', typeof cubesatMarkdown !== 'undefined' ? cubesatMarkdown : undefined);
            });
        }
        
        if (hearAboutMeBtn && aboutmeAudio) {
            hearAboutMeBtn.addEventListener('click', () => {
                playSpeech(aboutmeAudio, 'Playing: About Prajwal Valekar', typeof aboutMeSpeech !== 'undefined' ? aboutMeSpeech : undefined);
            });
        }

        if (closeSpeechBtn) {
            closeSpeechBtn.addEventListener('click', () => {
                speechWidget.classList.remove('show');
                if (currentAudio) {
                    currentAudio.pause();
                }
                
                // Resume background videos that are in view when speech is closed
                document.querySelectorAll('.scroll-autoplay-video').forEach(video => {
                    video.muted = false; // ensure they play with sound
                    const rect = video.getBoundingClientRect();
                    // check if at least partially in view
                    if (rect.top < window.innerHeight && rect.bottom >= 0) {
                        video.play().catch(e => console.log('Resume blocked:', e));
                    }
                });
            });
        }
    }

    // --- Autoplay Video on Scroll Logic ---
    const autoplayVideos = document.querySelectorAll('.scroll-autoplay-video');
    if (autoplayVideos.length > 0) {
        autoplayVideos.forEach(video => {
            const loader = video.parentElement.querySelector('.sexy-video-loader-wrapper');
            
            // Show loader when waiting for data (buffering)
            video.addEventListener('waiting', () => {
                if (loader) loader.classList.add('active');
            });

            // Hide loader when video starts playing or has enough data
            video.addEventListener('playing', () => {
                if (loader) loader.classList.remove('active');
            });
            
            video.addEventListener('canplay', () => {
                if (loader) loader.classList.remove('active');
            });
        });

        const videoObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const video = entry.target;
                if (entry.isIntersecting) {
                    // Check if speech is currently playing
                    const isSpeechPlaying = currentAudio && !currentAudio.paused;
                    
                    if (isSpeechPlaying) {
                        // If speech is playing, pause the video (do not play it silently)
                        video.pause();
                    } else {
                        // Play the video with its own audio
                        video.muted = false;
                        video.play().catch(e => {
                            console.log('Video play blocked:', e);
                            video.pause();
                        });
                    }
                } else {
                    video.pause();
                }
            });
        }, { threshold: 0.5 }); // Play when at least 50% visible

        autoplayVideos.forEach(video => videoObserver.observe(video));
    }

});
