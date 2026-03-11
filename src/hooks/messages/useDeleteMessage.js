import {useEffect} from "react";
import {getSocket, onMessageDelete} from "../../services/socket.js";
import {useQueryClient} from "@tanstack/react-query";

export function useDeleteMessage() {
    const queryClient = useQueryClient();

    useEffect(() => {
        onMessageDelete((type, roomId, messageId) => {
            queryClient.setQueryData([type, roomId], (old) => {
                if (!old) return old;

                return {
                    ...old,
                    messages: old.messages.filter(m => m.id !== messageId)
                }
            });
        })
    }, [queryClient]);
}

export function deleteMessage(type, messageId) {
    const socket = getSocket()

    socket.emit('message:delete', { type, messageId })
}