import {useEffect} from "react";
import {getSocket, onReactionUpdate} from "../../services/socket.js";
import {useQueryClient} from "@tanstack/react-query";

export function useReactMessage() {
    const queryClient = useQueryClient();

    useEffect(() => {
        onReactionUpdate((type, roomId, reaction, action) => {
            queryClient.setQueriesData({ queryKey: ['messages', roomId] }, (old) => {
                if (!old) return old;

                return old.map(msg => {
                    if (msg.id !== reaction.messageId) return msg;
                    const reactions = [...(msg.reactions || [])];
                    if (action === 'added') {
                        reactions.push({ emoji: reaction.emoji, userId: reaction.userId });
                    } else {
                        const index = reactions.findIndex(r => r.emoji === reaction.emoji && r.userId === reaction.userId);
                        if (index !== -1) reactions.splice(index, 1);
                    }
                    return { ...msg, reactions };
                })
            });
        })
    }, []);
}

export function toggleReaction(messageId, emoji) {
    const socket = getSocket()

    socket.emit('reaction:toggle', { messageId, emoji })
}