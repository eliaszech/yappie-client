const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

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

async function apiRequestWithCursor(method, path, body = null, cursor = null, limit = '50') {
    const params = new URLSearchParams({ limit });
    if (cursor) params.set('cursor', cursor);

    const res = await fetch(`${API_URL}${path}?${params}`, {
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

export const fetchSearchUsers = (query) => apiRequest('GET', `/users/search?query=${query}`);
export const sendFriendRequest = (selfId, userId) => apiRequest('POST', `/@me/friends/request`, { selfId, userId });
export const denyFriendRequest = (friendId, userId) => apiRequest('POST', `/@me/friends/request/deny`, { friendId, userId });
export const acceptFriendRequest = (friendId, userId) => apiRequest('POST', `/@me/friends/request/accept`, { friendId, userId });

export const fetchServer = (serverId) => apiRequest('GET', `/servers/${serverId}`);
export const fetchChannels = (serverId) => apiRequest('GET', `/servers/${serverId}/channels`);
export const fetchMembers = (type, id) => apiRequest('GET', type === 'members' ? `/servers/${id}/members` : `/conversations/${id}/participants`);
export const fetchChannel = (channelId) => apiRequest('GET', `/channels/${channelId}`);
export const fetchMessages = (type = 'conversation',channelId) => apiRequest('GET',
    type === 'channel' ? `/channels/${channelId}/messages` : `/conversations/${channelId}/messages`);

export const fetchVoiceToken = (data) => apiRequest('POST', `/voice/token`, data);
export const fetchChannelParticipants = (channelId) => apiRequest('GET', `/voice/participants/${channelId}`);

export const fetchGetOrCreateConversation = (userId, targetUserId) => apiRequest('POST', `/conversations/getOrCreate`, { userId: userId, targetUserId: targetUserId });

export const fetchConversations = (userId) => apiRequest('POST', `/conversations/list`, { userId: userId });

export const fetchConversation = (conversationId) => apiRequest('GET', `/conversations/${conversationId}`);
