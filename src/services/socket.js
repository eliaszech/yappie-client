import { io } from 'socket.io-client';
import { getToken } from './api';

const API_URL = import.meta.env.API_URL || 'http://localhost:3000';

let socket = null;
let presenceCallback = null;

let messageCallback = null;

let voiceCallback = null;

export function connectSocket() {
    if (socket) return socket;

    socket = io(API_URL, {
        auth: { token: getToken() },
    });

    socket.on('connect', () => {
        console.log('Socket connected:', socket.id);
    });

    socket.on('user:online', ({ userId }) => {
        if (presenceCallback) presenceCallback(userId, true);
    });

    socket.on('user:offline', ({ userId }) => {
        if (presenceCallback) presenceCallback(userId, false);
    });

    socket.on('message:new', (message) => {
        if (messageCallback) messageCallback(message);
    });

    socket.on('voice:join', (data) => {
        if (voiceCallback) voiceCallback('join', data);
    });

    socket.on('voice:leave', (data) => {
        if (voiceCallback) voiceCallback('leave', data);
    });

    return socket;
}

export function onPresenceChange(callback) {
    presenceCallback = callback;
}

export function onNewMessage(callback) {
    messageCallback = callback;
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
        presenceCallback = null;
    }
}