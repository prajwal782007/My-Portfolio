document.addEventListener('DOMContentLoaded', async () => {
    // DOM Elements
    const authLayer = document.getElementById('auth-layer');
    const appLayer = document.getElementById('app-layer');
    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    const loginBtn = document.getElementById('login-btn');
    const authError = document.getElementById('auth-error');
    const logoutBtn = document.getElementById('logout-btn');
    const convList = document.getElementById('conv-list');
    const chatMessages = document.getElementById('chat-messages');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatSendBtn = document.getElementById('chat-send-btn');
    const activeConvName = document.getElementById('active-conv-name');

    // Initialize Supabase clien
    const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // State
    let activeConversationId = null;
    let pollInterval = null;
    let session = null;

    // --- AUTH FLOW ---
    
    // Check initial session
    const { data: { session: initialSession } } = await supabaseClient.auth.getSession();
    if (initialSession) {
        session = initialSession;
        showApp();
    } else {
        authLayer.style.opacity = '1';
    }

    // Login Form Submit
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        authError.textContent = '';
        loginBtn.disabled = true;
        loginBtn.textContent = 'LOGGING IN...';

        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: emailInput.value,
            password: passwordInput.value,
        });

        if (error) {
            authError.textContent = error.message;
            loginBtn.disabled = false;
            loginBtn.textContent = 'SECURE LOGIN';
        } else {
            session = data.session;
            showApp();
        }
    });

    // Logout
    logoutBtn.addEventListener('click', async () => {
        await supabaseClient.auth.signOut();
        session = null;
        window.location.reload();
    });

    function showApp() {
        authLayer.style.display = 'none';
        appLayer.style.display = 'flex';
        loadConversations();
        startPolling();
    }

    // --- API HELPERS ---
    
    async function adminApiCall(action, method = 'GET', payload = null) {
        if (!session) throw new Error("No session");
        
        console.log("API key present:", Boolean(SUPABASE_ANON_KEY));
        
        const options = {
            method: method,
            headers: {
                "Authorization": `Bearer ${session.access_token}`,
                "apikey": SUPABASE_ANON_KEY,
                "Content-Type": "application/json"
            }
        };

        if (payload && method === 'POST') {
            options.body = JSON.stringify(payload);
        }

        const response = await fetch(`${FUNCTION_BASE_URL}/admin/${action}`, options);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || data.message || 'API Error');
        }
        return data;
    }

    // --- UI UPDATES ---

    async function loadConversations() {
        try {
            const data = await adminApiCall('conversations');
            renderConversations(data.conversations || []);
        } catch (error) {
            console.error('Failed to load conversations', error);
            if (error.message.includes('JWT') || error.message.includes('Unauthorized')) {
                logoutBtn.click();
            }
        }
    }

    function renderConversations(conversations) {
        convList.innerHTML = '';
        
        if (conversations.length === 0) {
            convList.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--text-dim); font-size: 0.85rem;">No conversations yet</div>';
            return;
        }

        conversations.forEach(conv => {
            const div = document.createElement('div');
            div.className = `conv-item ${conv.id === activeConversationId ? 'active' : ''}`;
            
            // Format time
            const timeStr = conv.last_message_at 
                ? new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                : 'New';

            let previewText = 'No messages';
            let unreadDot = '';
            
            if (conv.last_message) {
                previewText = conv.last_message.content;
                // Mark unread if the last message was from visitor (a simple heuristic for admin)
                if (conv.last_message.sender === 'visitor') {
                    unreadDot = '<span class="unread-dot"></span>';
                    div.style.background = 'rgba(255,255,255,0.03)';
                }
            }

            div.innerHTML = `
                <div class="conv-header">
                    <span class="conv-name">${conv.visitor_name}${unreadDot}</span>
                    <span class="conv-time">${timeStr}</span>
                </div>
                <div class="conv-preview">${previewText}</div>
            `;

            div.addEventListener('click', () => {
                document.querySelectorAll('.conv-item').forEach(el => el.classList.remove('active'));
                div.classList.add('active');
                div.style.background = ''; // clear unread hint
                const dot = div.querySelector('.unread-dot');
                if(dot) dot.remove();
                
                openConversation(conv.id, conv.visitor_name);
            });

            convList.appendChild(div);
        });
    }

    async function openConversation(id, visitorName) {
        activeConversationId = id;
        activeConvName.textContent = visitorName;
        chatForm.style.display = 'flex';
        
        chatMessages.innerHTML = '<div class="empty-state">Loading...</div>';
        await loadMessages(id);
    }

    async function loadMessages(convId) {
        if (!convId) return;
        
        try {
            const data = await adminApiCall(`messages?conversation_id=${convId}`);
            renderMessages(data.messages || []);
        } catch (error) {
            console.error('Failed to load messages', error);
            chatMessages.innerHTML = '<div class="empty-state" style="color: #ff4444;">Error loading messages</div>';
        }
    }

    function renderMessages(messages) {
        if (!messages || messages.length === 0) {
            chatMessages.innerHTML = '<div class="empty-state">No messages yet.</div>';
            return;
        }

        // Only update DOM if count changed to prevent scroll jumping while typing
        const currentMsgCount = chatMessages.querySelectorAll('.chat-message').length;
        if (currentMsgCount === messages.length && !chatMessages.querySelector('.empty-state')) {
            return;
        }

        chatMessages.innerHTML = '';
        
        messages.forEach(msg => {
            const div = document.createElement('div');
            // For admin, visitor is on left (visitor class), prajwal is on right (prajwal class)
            // But wait, the CSS is:
            // .chat-message.visitor { align-self: flex-start; background: rgba(255, 255, 255, 0.05); }
            // .chat-message.prajwal { align-self: flex-end; background: rgba(255, 77, 0, 0.1); }
            
            div.className = `chat-message ${msg.sender === 'visitor' ? 'visitor' : 'prajwal'}`;
            
            const contentSpan = document.createElement('span');
            contentSpan.textContent = msg.content;
            div.appendChild(contentSpan);
            
            const timeSpan = document.createElement('span');
            timeSpan.className = 'chat-message-time';
            timeSpan.textContent = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            div.appendChild(timeSpan);
            
            chatMessages.appendChild(div);
        });

        scrollToBottom();
    }

    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // --- SEND MESSAGE ---
    
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!activeConversationId) return;
        
        const content = chatInput.value.trim();
        if (!content) return;

        chatInput.disabled = true;
        chatSendBtn.disabled = true;

        try {
            await adminApiCall('send', 'POST', {
                conversation_id: activeConversationId,
                content: content
            });
            chatInput.value = '';
            
            // Instantly refresh
            await loadMessages(activeConversationId);
            // Refresh list to update latest preview
            loadConversations();
        } catch (error) {
            console.error('Send error:', error);
            const origPlace = chatInput.placeholder;
            chatInput.placeholder = 'Failed to send...';
            setTimeout(() => chatInput.placeholder = origPlace, 2000);
        } finally {
            chatInput.disabled = false;
            chatSendBtn.disabled = false;
            chatInput.focus();
        }
    });

    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            chatSendBtn.click();
        }
    });

    // --- POLLING ---
    
    function startPolling() {
        if (pollInterval) clearInterval(pollInterval);
        
        pollInterval = setInterval(async () => {
            // Background update without showing loading spinners
            await loadConversations();
            if (activeConversationId) {
                await loadMessages(activeConversationId);
            }
        }, 3000);
    }
});
