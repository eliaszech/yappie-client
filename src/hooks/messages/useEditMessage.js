import { useEffect } from "react";
import { getSocket, onMessageEdit } from "../../services/socket.js";
import { useQueryClient } from "@tanstack/react-query";

export function useEditMessage() {
    const queryClient = useQueryClient();

    useEffect(() => {
        onMessageEdit((type, roomId, message) => {
            queryClient.setQueryData(['messages', roomId], (old) => {
                if (!old) return old;
                return {
                    ...old,
                    messages: old.messages.map(m =>
                        m.id === message.id ? { ...m, text: message.text, edited: true } : m
                    ),
                };
            });
        });

        return () => onMessageEdit(null);
    }, [queryClient]);
}

export function editMessage(type, messageId, text) {
    const socket = getSocket();
    socket.emit('message:edit', { type, messageId, text });
}
