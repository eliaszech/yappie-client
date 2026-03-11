import {useEffect, useRef, useState} from "react";
import {getSocket} from "../services/socket.js";
import {useAuth} from "./useAuth.js";

export function useTyping(type = 'conversation', roomId) {
    const {user} = useAuth();
    const [typingUsers, setTypingUsers] = useState([]);
    const timeoutRef = useRef(null);

    useEffect(() => {
        const socket = getSocket();
        if (!socket) return;

        socket.on('typing:start', (data) => {
            if (data.roomId !== roomId) return;
            setTypingUsers(prev =>
                prev.some(typingUser => typingUser.id === data.userId) ? prev : [...prev, {
                    id: data.userId,
                    username: data.username,
                }]
            );
        });

        socket.on('typing:stop', (data) => {
            if (data.roomId !== roomId) return;
            setTypingUsers((prev) => prev.filter(typingUser => typingUser.id !== data.userId));
        });

        return () => {
            socket.off('typing:start');
            socket.off('typing:stop');
        };
    }, [roomId]);

    function sendTyping() {
        const socket = getSocket();
        if (!socket) return;

        socket.emit('typing:start', type, roomId, user.username);

        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            socket.emit('typing:stop', type, roomId);
        }, 2000);
    }

    function stopTyping() {
        const socket = getSocket();
        if (!socket) return;
        clearTimeout(timeoutRef.current);
        socket.emit('typing:stop', type, roomId);
    }

    return { typingUsers, sendTyping, stopTyping };
}