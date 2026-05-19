import { io } from 'socket.io-client';
import { getToken } from './api';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

let socket = null;
let presenceCallback = null;

let messageCallback = null;
let messageDeleteCallback = null;
let messageEditCallback = null;
let reactionCallback = null;
let friendRequestCallback = null;
let userServerUpdateCallback = null;

let voiceCallback = null;
let voiceActionCallback = null;
let channelChangeCallback = null;
let afkMoveCallback = null;
let callEventCallback = null;
let pollUpdateCallback = null;
let activityCallback = null;
let activitySyncCallback = null;
let pinCallback = null;
let conversationCreatedCallback = null;
let roleChangeCallback = null;
let memberRolesChangeCallback = null;

let eventsRegistered = false;

function registerEvents() {
    if (!socket || eventsRegistered) return;

    socket.on('user:online', ({userId, online, status}) => {
        if (presenceCallback) presenceCallback(userId, online, status);
    });

    socket.on('user:offline', (data) => {
        if (presenceCallback) presenceCallback(data.userId, false, 'invisible');
    });

    socket.on('user:statusChange', (data) => {
        if (presenceCallback) presenceCallback(data.userId, data.online, data.status);
    });

    socket.on('message:new', (message) => {
        if (messageCallback) messageCallback(message);
    });

    socket.on('friend:request:new', (friendRequest) => {
        if(friendRequestCallback) friendRequestCallback('new', friendRequest);
    })

    socket.on('friend:request:declined', (friendId) => {
        if(friendRequestCallback) friendRequestCallback('declined', friendId);
    })

    socket.on('friend:request:accepted', (friendId) => {
        if(friendRequestCallback) friendRequestCallback('accepted', friendId);
    })

    socket.on('server:user:updated', (type, member) => {
        if(userServerUpdateCallback) userServerUpdateCallback(type, member);
    })

    socket.on('reaction:update', (type, roomId, reaction, action) => {
        if(reactionCallback) reactionCallback(type, roomId, reaction, action);
    })

    socket.on('message:deleted', (type, roomId, messageId, replies) => {
        if (messageDeleteCallback) messageDeleteCallback(type, roomId, messageId, replies);
    });

    socket.on('message:edited', (type, roomId, message) => {
        if (messageEditCallback) messageEditCallback(type, roomId, message);
    });

    socket.on('voice:join', (data) => {
        if (voiceCallback) voiceCallback('join', data);
    });

    socket.on('voice:leave', (data) => {
        if (voiceCallback) voiceCallback('leave', data);
    });

    socket.on('voice:afk', (data) => {
        if (afkMoveCallback) afkMoveCallback(data);
    });

    socket.on('voice:move', (data) => {
        if (voiceActionCallback) voiceActionCallback('move', data);
    });

    socket.on('voice:disconnect', (data) => {
        if (voiceActionCallback) voiceActionCallback('disconnect', data);
    });

    socket.on('call:incoming', (data) => {
        if (callEventCallback) callEventCallback('incoming', data);
    });
    socket.on('call:accepted', (data) => {
        if (callEventCallback) callEventCallback('accepted', data);
    });
    socket.on('call:ringTimeout', (data) => {
        if (callEventCallback) callEventCallback('ringTimeout', data);
    });
    socket.on('call:ended', (data) => {
        if (callEventCallback) callEventCallback('ended', data);
    });

    socket.on('channel:created', (data) => {
        if (channelChangeCallback) channelChangeCallback('created', data);
    });
    socket.on('channel:updated', (data) => {
        if (channelChangeCallback) channelChangeCallback('updated', data);
    });
    socket.on('channel:deleted', (data) => {
        if (channelChangeCallback) channelChangeCallback('deleted', data);
    });
    socket.on('channel:positions', (data) => {
        if (channelChangeCallback) channelChangeCallback('positions', data);
    });
    socket.on('channel:overwrites', (data) => {
        if (channelChangeCallback) channelChangeCallback('overwrites', data);
    });

    socket.on('poll:update', (data) => {
        if (pollUpdateCallback) pollUpdateCallback(data);
    });

    socket.on('user:activityChange', (data) => {
        if (activityCallback) activityCallback(data);
    });

    socket.on('user:activitySync', (snapshot) => {
        if (activitySyncCallback) activitySyncCallback(snapshot);
    });

    socket.on('message:pinned', (data) => {
        if (pinCallback) pinCallback('pinned', data);
    });

    socket.on('message:unpinned', (data) => {
        if (pinCallback) pinCallback('unpinned', data);
    });

    socket.on('conversation:new', (conversation) => {
        if (conversationCreatedCallback) conversationCreatedCallback(conversation);
    });

    socket.on('role:created', (data) => {
        if (roleChangeCallback) roleChangeCallback('created', data);
    });
    socket.on('role:updated', (data) => {
        if (roleChangeCallback) roleChangeCallback('updated', data);
    });
    socket.on('role:deleted', (data) => {
        if (roleChangeCallback) roleChangeCallback('deleted', data);
    });
    socket.on('role:positions', (data) => {
        if (roleChangeCallback) roleChangeCallback('positions', data);
    });
    socket.on('member:roles-changed', (data) => {
        if (memberRolesChangeCallback) memberRolesChangeCallback(data);
    });

    eventsRegistered = true;
}

export function connectSocket() {
    if (socket) return socket;

    socket = io(API_URL, {
        auth: { token: getToken() },
    });

    socket.on('connect', () => {
        console.log('Socket connected:', socket.id);
    });

    if (presenceCallback) registerEvents();

    return socket;
}

export function onPresenceChange(callback) {
    presenceCallback = callback;
}

export function onNewMessage(callback) {
    messageCallback = callback;
}

export function onReactionUpdate(callback) {
    reactionCallback = callback;
}

export function onFriendRequest(callback) {
    friendRequestCallback = callback;
}

export function onMessageDelete(callback) {
    messageDeleteCallback = callback;
}

export function onMessageEdit(callback) {
    messageEditCallback = callback;
}

export function onUserServerUpdate(callback) {
    userServerUpdateCallback = callback;
}

export function onVoiceChange(callback) {
    voiceCallback = callback;
}

export function onAfkMove(callback) {
    afkMoveCallback = callback;
}

export function onVoiceAction(callback) {
    voiceActionCallback = callback;
}

export function onChannelChange(callback) {
    channelChangeCallback = callback;
}

export function onCallEvent(callback) {
    callEventCallback = callback;
}

export function onPollUpdate(callback) {
    pollUpdateCallback = callback;
}

export function onActivityChange(callback) {
    activityCallback = callback;
}

export function onActivitySync(callback) {
    activitySyncCallback = callback;
}

export function onPinUpdate(callback) {
    pinCallback = callback;
}

export function onConversationCreated(callback) {
    conversationCreatedCallback = callback;
}

export function onRoleChange(callback) {
    roleChangeCallback = callback;
}

export function onMemberRolesChange(callback) {
    memberRolesChangeCallback = callback;
}

export function getSocket() {
    return socket;
}

export function disconnectSocket() {
    if (socket) {
        socket.disconnect();
        socket = null;
        eventsRegistered = false;
    }
}