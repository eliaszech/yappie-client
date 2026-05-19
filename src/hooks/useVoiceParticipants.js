import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { onVoiceChange } from '../services/socket';
import { useAuth } from './useAuth';

export function useVoiceEvents() {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    useEffect(() => {
        onVoiceChange((type, data) => {
            // Conversation-scoped join/leave: also patch the call cache so the
            // banner reacts live. We update the call cache for our own joins
            // too (the banner needs to know we're in).
            if (data?.conversationId) {
                const cid = data.conversationId;
                queryClient.setQueryData(['conversation-call', cid], (old) => {
                    if (type === 'join') {
                        const next = old ?? {
                            conversationId: cid,
                            startedBy: data.userId,
                            startedAt: Date.now(),
                            participants: [],
                            ringing: false,
                        };
                        if (next.participants.includes(data.userId)) return next;
                        return { ...next, participants: [...next.participants, data.userId] };
                    }
                    if (type === 'leave') {
                        if (!old) return old;
                        const participants = old.participants.filter(id => id !== data.userId);
                        if (participants.length === 0) return null;
                        return { ...old, participants };
                    }
                    return old;
                });
            }

            // Skip our own join broadcast: while connecting we already render
            // ourselves via the spinner row, and once connected LiveKit's live
            // participant list takes over. Letting our own entry leak into the
            // polled cache here causes a duplicate row during the connect window.
            if (type === 'join' && data.userId === user?.id) return;

            // Conversation calls share the same join/leave events but key on
            // conversationId instead of channelId.
            const cacheKey = data.conversationId
                ? ['voice-participants', `conversation-${data.conversationId}`]
                : ['voice-participants', data.channelId];

            queryClient.setQueryData(cacheKey, (old = []) => {
                if (type === 'join') {
                    if (old.some(p => p.identity === data.userId)) return old;
                    return [...old, { identity: data.userId, name: data.username, isMuted: data.attributes?.muted, isDeafened: data.attributes?.deafened }];
                }
                if (type === 'leave') {
                    return old.filter(p => p.identity !== data.userId);
                }
                return old;
            });
        });

        return () => onVoiceChange(null);
    }, [queryClient, user?.id]);
}