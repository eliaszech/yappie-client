import {useEffect, useRef, useState} from "react";
import {getSocket} from "../services/socket.js";

export function useTyping(conversationId) {
    const [typingUsers, setTypingUsers] = useState([]);
    const timeoutRef = useRef(null);

    useEffect(() => {
        const socket = getSocket();
        if (!socket) return;

        socket.on('typing:start', (data) => {
            if (data.conversationId !== conversationId) return;
            setTypingUsers(prev =>
                prev.includes(data.userId) ? prev : [...prev, data.userId]
            );
        });

        socket.on('typing:stop', (data) => {
            if (data.conversationId !== conversationId) return;
            setTypingUsers(prev => prev.filter(id => id !== data.userId));
        });

        return () => {
            socket.off('typing:start');
            socket.off('typing:stop');
        };
    }, [conversationId]);

    function sendTyping() {
        const socket = getSocket();
        if (!socket) return;

        socket.emit('typing:start', conversationId);

        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            socket.emit('typing:stop', conversationId);
        }, 2000);
    }

    function stopTyping() {
        const socket = getSocket();
        if (!socket) return;
        clearTimeout(timeoutRef.current);
        socket.emit('typing:stop', conversationId);
    }

    return { typingUsers, sendTyping, stopTyping };
}