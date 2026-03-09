import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { onVoiceChange } from '../services/socket';
import {playJoinSound, playLeaveSound} from "../services/sounds.js";

export function useVoiceEvents() {
    const queryClient = useQueryClient();

    useEffect(() => {
        onVoiceChange((type, data) => {
            queryClient.setQueryData(['voice-participants', data.channelId], (old = []) => {
                if (type === 'join') {
                    if (old.some(p => p.identity === data.userId)) return old;
                    return [...old, { identity: data.userId, name: data.username }];
                }
                if (type === 'leave') {
                    return old.filter(p => p.identity !== data.userId);
                }
                return old;
            });
        });

        return () => onVoiceChange(null);
    }, [queryClient]);
}