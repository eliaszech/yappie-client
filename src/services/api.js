const API_URL = import.meta.env.API_URL || 'http://5.175.166.53:3000/api';

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
    const res = await fetch(`${API_URL}${path}`, {
        method,
        body: body ? JSON.stringify(body) : null,
        headers: {
            'Authorization': `Bearer ${getToken()}`,
            'Content-Type': 'application/json',
        }
    });

    if (!res.ok && res.status !== 304) throw new Error(`API Fehler: ${res.status}`);
    return res.json();
}

//export const fetchUsers = () => apiRequest('GET', '/users');

export const fetchFriends = () => apiRequest('GET', `/@me/friends`);
export const fetchServers = () => apiRequest('GET', `/@me/servers`);

export const fetchServer = (serverId) => apiRequest('GET', `/servers/${serverId}`);
export const fetchChannels = (serverId) => apiRequest('GET', `/servers/${serverId}/channels`);
export const fetchMembers = (serverId) => apiRequest('GET', `/servers/${serverId}/members`);
export const fetchChannel = (channelId) => apiRequest('GET', `/channels/${channelId}`);

export const fetchVoiceToken = (data) => apiRequest('POST', `/voice/token`, data);
export const fetchChannelParticipants = (channelId) => apiRequest('GET', `/voice/participants/${channelId}`);

export const fetchGetOrCreateConversation = (userId, targetUserId) => apiRequest('POST', `/conversations/getOrCreate`, { userId: userId, targetUserId: targetUserId });

export const fetchConversations = (userId) => apiRequest('POST', `/conversations/list`, { userId: userId });

export const fetchConversation = (conversationId) => apiRequest('GET', `/conversations/${conversationId}`);
