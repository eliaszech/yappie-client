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
    try {
        const res = await fetch(`${API_URL}${path}`, {
            method,
            body: body ? JSON.stringify(body) : null,
            headers: {
                'Authorization': `Bearer ${getToken()}`,
                'Content-Type': 'application/json',
            }
        });

        if (res.status === 401 && !path.startsWith('/auth/')) {
            window.dispatchEvent(new CustomEvent('auth:unauthorized'));
            return { status: 401, error: 'Nicht autorisiert' };
        }

        if (!res.ok && res.status !== 304) {
            const errorMessage = await res.json();
            return { status: res.status, error: `API Fehler: ${errorMessage.error || 'Unbekannter Fehler'}` };
        }
        return res.json();
    } catch (error) {
        return { status: 400, error: error.message };
    }
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
export const fetchCommonServersWith = (userId) => apiRequest('POST', `/users/servers/common`, { userId });

export const sendFriendRequest = (selfId, userId) => apiRequest('POST', `/@me/friends/request`, { selfId, userId });
export const denyFriendRequest = (friendId, userId) => apiRequest('POST', `/@me/friends/request/deny`, { friendId, userId });
export const acceptFriendRequest = (friendId, userId) => apiRequest('POST', `/@me/friends/request/accept`, { friendId, userId });

export const fetchServer = (serverId) => apiRequest('GET', `/servers/${serverId}`);
export const createServer = (serverName) => apiRequest('POST', `/servers/create`, { serverName });
export const deleteServer = (serverId) => apiRequest('POST', `/servers/delete`, { serverId });
export const fetchChannels = (serverId) => apiRequest('GET', `/servers/${serverId}/channels`);
export const createChannel = (serverId, name, type) => apiRequest('POST', `/servers/${serverId}/channels`, { name, type });
export const fetchMembers = (type, id) => apiRequest('GET', type === 'members' ? `/servers/${id}/members` : `/conversations/${id}/participants`);
export const updateServer = (serverId, data) => apiRequest('PATCH', `/servers/${serverId}`, data);
export const kickMember = (serverId, memberId) => apiRequest('POST', `/servers/${serverId}/members/${memberId}/kick`);

export const fetchRoles = (serverId) => apiRequest('GET', `/servers/${serverId}/roles`);
export const createRole = (serverId, data) => apiRequest('POST', `/servers/${serverId}/roles`, data);
export const updateRole = (serverId, roleId, data) => apiRequest('PATCH', `/servers/${serverId}/roles/${roleId}`, data);
export const updateRolePositions = (serverId, roleIds) => apiRequest('PUT', `/servers/${serverId}/roles/positions`, { roleIds });
export const deleteRole = (serverId, roleId) => apiRequest('DELETE', `/servers/${serverId}/roles/${roleId}`);
export const assignRole = (serverId, memberId, roleId) => apiRequest('POST', `/servers/${serverId}/members/${memberId}/roles`, { roleId });
export const removeRole = (serverId, userId, roleId) => apiRequest('DELETE', `/servers/${serverId}/members/${userId}/roles/${roleId}`);
export const fetchChannel = (channelId) => apiRequest('GET', `/channels/${channelId}`);
export const fetchMessages = (type = 'conversation',channelId, cursor = '') => apiRequest('GET',
    type === 'channel' ? `/channels/${channelId}/messages?cursor=${cursor}` : `/conversations/${channelId}/messages?cursor=${cursor}`);

export const createInvite = (serverId) => apiRequest('POST', `/servers/${serverId}/invites/create`);
export const joinServer = (inviteCode) => apiRequest('POST', `/servers/join`, { inviteCode });

export const updateChannel = (serverId, channelId, data) => apiRequest('PATCH', `/servers/${serverId}/channels/${channelId}`, data);
export const deleteChannel = (serverId, channelId) => apiRequest('DELETE', `/servers/${serverId}/channels/${channelId}`);

export const fetchVoiceToken = (data) => apiRequest('POST', `/voice/token`, data);
export const fetchChannelParticipants = (channelId) => apiRequest('GET', `/voice/participants/${channelId}`);

export const fetchConversations = (userId) => apiRequest('POST', `/conversations/list`, { userId: userId });
export const fetchConversation = (conversationId) => apiRequest('GET', `/conversations/${conversationId}`);
export const fetchOrCreateConversationWith = (receiverId) => apiRequest('POST', `/conversations/getOrCreate`, { targetUserId: receiverId });

export const fetchReadStates = () => apiRequest('GET', `/@me/read-states`);
export const markChannelRead = (channelId) => apiRequest('POST', `/channels/${channelId}/read`);
export const markConversationRead = (conversationId) => apiRequest('POST', `/conversations/${conversationId}/read`);
export const hideConversation = (conversationId) => apiRequest('POST', `/conversations/${conversationId}/hide`);

export const fetchChannelPins = (channelId) => apiRequest('GET', `/channels/${channelId}/pins`);
export const pinMessage = (channelId, messageId) => apiRequest('POST', `/channels/${channelId}/messages/${messageId}/pin`);
export const unpinMessage = (channelId, messageId) => apiRequest('DELETE', `/channels/${channelId}/messages/${messageId}/pin`);

export const searchMessages = (type, id, query) => apiRequest('GET',
    type === 'channel'
        ? `/channels/${id}/search?q=${encodeURIComponent(query)}`
        : `/conversations/${id}/search?q=${encodeURIComponent(query)}`);

export const createPoll = (data) => apiRequest('POST', `/polls`, data);
export const votePoll = (pollId, optionId) => apiRequest('POST', `/polls/${pollId}/vote`, { optionId });
export const removePollVote = (pollId, optionId) => apiRequest('DELETE', `/polls/${pollId}/vote/${optionId}`);

export const updateProfile = (data) => apiRequest('PATCH', `/@me/profile`, data);
export const changePassword = (data) => apiRequest('PATCH', `/@me/password`, data);

export async function uploadAvatar(file) {
    const formData = new FormData();
    formData.append('avatar', file);
    try {
        const res = await fetch(`${API_URL}/@me/avatar`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${getToken()}` },
            body: formData,
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            return { error: err.error || 'Upload fehlgeschlagen' };
        }
        return res.json();
    } catch (e) {
        return { error: e.message };
    }
}

export async function uploadServerIcon(serverId, file) {
    const formData = new FormData();
    formData.append('icon', file);
    try {
        const res = await fetch(`${API_URL}/servers/${serverId}/icon`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${getToken()}` },
            body: formData,
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            return { error: err.error || 'Upload fehlgeschlagen' };
        }
        return res.json();
    } catch (e) {
        return { error: e.message };
    }
}

export async function uploadMessageFiles(files) {
    const formData = new FormData();
    for (const file of files) formData.append('files', file);
    try {
        const res = await fetch(`${API_URL}/uploads/messages`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${getToken()}` },
            body: formData,
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            return { error: err.error || 'Upload fehlgeschlagen' };
        }
        return res.json();
    } catch (e) {
        return { error: e.message };
    }
}
