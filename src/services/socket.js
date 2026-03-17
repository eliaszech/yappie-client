import { io } from 'socket.io-client';
import { getToken } from './api';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

let socket = null;
let presenceCallback = null;

let messageCallback = null;
let messageDeleteCallback = null;
let reactionCallback = null;
let friendRequestCallback = null;

let voiceCallback = null;

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

    socket.on('reaction:update', (type, roomId, reaction, action) => {
        if(reactionCallback) reactionCallback(type, roomId, reaction, action);
    })

    socket.on('message:deleted', (type, roomId, messageId, replies) => {
        if (messageDeleteCallback) messageDeleteCallback(type, roomId, messageId, replies);
    });

    socket.on('voice:join', (data) => {
        if (voiceCallback) voiceCallback('join', data);
    });

    socket.on('voice:leave', (data) => {
        if (voiceCallback) voiceCallback('leave', data);
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

export function onVoiceChange(callback) {
    voiceCallback = callback;
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