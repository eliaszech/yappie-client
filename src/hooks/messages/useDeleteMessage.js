import {useEffect} from "react";
import {getSocket, onMessageDelete} from "../../services/socket.js";
import {useQueryClient} from "@tanstack/react-query";

export function useDeleteMessage() {
    const queryClient = useQueryClient();

    useEffect(() => {
        onMessageDelete((type, roomId, messageId, replies) => {
            queryClient.setQueryData(['messages', roomId], (old) => {
                if (!old) return old;

                return old.filter(m => m.id !== messageId)
                    .map(m => {
                        if (replies?.includes(m.id)) {
                            return { ...m, replyTo: null, replyToId: null };
                        }
                        return m;
                    })
            });
        })

        return () => onMessageDelete(null);
    }, [queryClient]);
}

export function deleteMessage(type, messageId) {
    const socket = getSocket()

    socket.emit('message:delete', { type, messageId })
}