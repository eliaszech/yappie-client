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

function apiRequest(method, path) {
    const res = fetch(`${API_URL}${path}`, {
        method,
        headers: {
            'Authorization': `Bearer ${getToken()}`
        }
    });

    if(!res.ok) throw new Error('Api request failed');
    return res.json();
}

export const fetchUsers = () => apiRequest('GET', '/users');

export const fetchConversations = () => apiRequest('GET', '/conversations?userId=eb01c1dc-dbcc-4bb8-8e09-dc9150dc9063');

export const fetchConversation = (conversationId) => apiRequest('GET', `/conversations/${conversationId}`);
