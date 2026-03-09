import { io } from 'socket.io-client';
import { getToken } from './api';

const API_URL = import.meta.env.API_URL || 'http://localhost:3000';

let socket = null;

export function connectSocket() {
    if (socket) return socket;

    socket = io(API_URL, {
        auth: { token: getToken() }
    });

    return socket;
}

export function getSocket() {
    return socket;
}

export function disconnectSocket() {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}