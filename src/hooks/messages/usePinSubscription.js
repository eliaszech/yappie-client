import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { onPinUpdate } from '../../services/socket.js';

export function usePinSubscription() {
    const queryClient = useQueryClient();

    useEffect(() => {
        onPinUpdate((action, data) => {
            // Pin events come for both channels and conversations; pick the
            // right roomId + pins cache key based on which one is present.
            const roomId = data.channelId ?? data.conversationId;
            const pinsKey = data.channelId
                ? ['channelPins', data.channelId]
                : ['conversationPins', data.conversationId];
            if (!roomId) return;

            if (action === 'pinned') {
                const { message } = data;
                queryClient.setQueryData(['messages', roomId], (old) => {
                    if (!old) return old;
                    return {
                        ...old,
                        messages: old.messages.map((m) =>
                            m.id === message.id
                                ? { ...m, pinned: true, pinnedAt: message.pinnedAt, pinnedById: message.pinnedById }
                                : m,
                        ),
                    };
                });
                queryClient.setQueryData(pinsKey, (old) => {
                    if (!Array.isArray(old)) return old;
                    if (old.some((m) => m.id === message.id)) return old;
                    return [message, ...old];
                });
            } else if (action === 'unpinned') {
                const { messageId } = data;
                queryClient.setQueryData(['messages', roomId], (old) => {
                    if (!old) return old;
                    return {
                        ...old,
                        messages: old.messages.map((m) =>
                            m.id === messageId ? { ...m, pinned: false, pinnedAt: null, pinnedById: null } : m,
                        ),
                    };
                });
                queryClient.setQueryData(pinsKey, (old) => {
                    if (!Array.isArray(old)) return old;
                    return old.filter((m) => m.id !== messageId);
                });
            }
        });

        return () => onPinUpdate(null);
    }, [queryClient]);
}
