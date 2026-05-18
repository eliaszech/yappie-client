import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { onVoiceChange } from '../services/socket';
import { useAuth } from './useAuth';

export function useVoiceEvents() {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    useEffect(() => {
        onVoiceChange((type, data) => {
            // Skip our own join broadcast: while connecting we already render
            // ourselves via the spinner row, and once connected LiveKit's live
            // participant list takes over. Letting our own entry leak into the
            // polled cache here causes a duplicate row during the connect window.
            if (type === 'join' && data.userId === user?.id) return;

            queryClient.setQueryData(['voice-participants', data.channelId], (old = []) => {
                if (type === 'join') {
                    if (old.some(p => p.identity === data.userId)) return old;
                    return [...old, { identity: data.userId, name: data.username, isMuted: data.attributes.muted, isDeafened: data.attributes.deafened }];
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