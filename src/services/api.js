const API_URL = import.meta.env.API_URL || 'http://localhost:3000';

export function getToken() {
    return localStorage.getItem('token');
}

export function setToken(token) {
    localStorage.setItem('token', token);
}

export function removeToken() {
    localStorage.removeItem('token');
}

async function apiRequest(method, path, body = null) {
    const token = getToken();

    const res = await fetch(`${API_URL}${path}`, {
        method,
        body: body ? JSON.stringify(body) : null,
        headers: {
            'Authorization': `Bearer ${getToken()}`
        }
    });

    if (!res.ok && res.status !== 304) throw new Error(`API Fehler: ${res.status}`);
    return res.json();
}

export const fetchUsers = () => apiRequest('GET', '/users');

export const fetchConversations = (userId) => apiRequest('GET', `/conversations?userId=${userId}`);

export const fetchConversation = (conversationId) => apiRequest('GET', `/conversations/${conversationId}`);
