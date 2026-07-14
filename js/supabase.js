// Supabase Configuration
const SUPABASE_URL = 'https://dnidbhljnrxjsmotwkfr.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_nhoLOoKlqF4qvqbmHtMY1g_RT_mPdAp';
const FUNCTION_BASE_URL = `${SUPABASE_URL}/functions/v1/chat-api`;

// Persistent Identity
function getVisitorToken() {
    let token = localStorage.getItem('prajwal_portfolio_visitor_token');
    if (!token) {
        // Fallback for file:// protocol where crypto.randomUUID is undefined
        if (window.crypto && window.crypto.randomUUID) {
            token = crypto.randomUUID();
        } else if (window.crypto && window.crypto.getRandomValues) {
            token = '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c =>
                (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
            );
        } else {
            // Ultimate fallback if crypto is completely unavailable
            token = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }
        localStorage.setItem('prajwal_portfolio_visitor_token', token);
    }
    return token;
}

// Edge Function API Wrapper
async function apiCall(action, payload = {}) {
    const token = getVisitorToken();
    try {
        const response = await fetch(`${FUNCTION_BASE_URL}/${action}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY
            },
            body: JSON.stringify({
                visitor_token: token,
                ...payload
            })
        });
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'API Error');
        }
        return data;
    } catch (error) {
        console.error(`Chat API Error (${action}):`, error);
        throw error;
    }
}

// Global ChatAPI Exposed
window.ChatAPI = {
    getStatus: async () => {
        try {
            const response = await fetch(`${FUNCTION_BASE_URL}/status`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'apikey': SUPABASE_ANON_KEY
                }
            });
            return await response.json();
        } catch (e) {
            console.error('Failed to get chat status', e);
            return null;
        }
    },
    startChat: (displayName) => apiCall('start', displayName ? { display_name: displayName } : {}),
    getMessages: () => apiCall('messages'),
    sendMessage: (content) => apiCall('send', { content })
};

// Auto-test for Stage 2 (just to ensure identity logic triggers and can be inspected)
console.log('Visitor Identity Initialized. Token:', getVisitorToken());
