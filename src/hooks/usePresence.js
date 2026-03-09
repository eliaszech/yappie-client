import { useEffect } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import {onPresenceChange} from '../services/socket';

export function usePresence() {
    const queryClient = useQueryClient();

    useEffect(() => {
        onPresenceChange((userId, online) => {
            queryClient.setQueryData(['presence'], (old = {}) => ({
                ...old, [userId]: online
            }));
        });

        return () => onPresenceChange(null);
    }, [queryClient]);
}

export function useIsOnline(userId) {
    const { data: presence = {} } = useQuery({
        queryKey: ['presence'],
        queryFn: () => ({}),
        staleTime: Infinity,
    });

    return presence[userId];
}