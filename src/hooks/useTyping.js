import {useEffect, useRef, useState} from "react";
import {getSocket} from "../services/socket.js";
import {useAuth} from "./useAuth.js";

export function useTyping(type = 'conversation', roomId) {
    const {user} = useAuth();
    const [typingUsers, setTypingUsers] = useState([]);
    const timeoutRef = useRef(null);

    useEffect(() => {
        // Reset whenever we switch rooms — otherwise the previous channel's
        // typing users stay in state forever (we'd only ever drop them if a
        // typing:stop happens to arrive, which doesn't if the user already
        // hit send before we left).
        setTypingUsers([]);

        const socket = getSocket();
        if (!socket) return;

        function handleStart(data) {
            if (data.roomId !== roomId) return;
            if (data.userId === user?.id) return;
            setTypingUsers(prev =>
                prev.some(typingUser => typingUser.id === data.userId) ? prev : [...prev, {
                    id: data.userId,
                    username: data.username,
                }]
            );
        }
        function handleStop(data) {
            if (data.roomId !== roomId) return;
            setTypingUsers((prev) => prev.filter(typingUser => typingUser.id !== data.userId));
        }

        socket.on('typing:start', handleStart);
        socket.on('typing:stop', handleStop);

        return () => {
            socket.off('typing:start', handleStart);
            socket.off('typing:stop', handleStop);
        };
    }, [roomId, user?.id]);

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