import { useEffect } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import {onPresenceChange} from '../services/socket';

export function usePresence() {
    const queryClient = useQueryClient();

    useEffect(() => {
        onPresenceChange((userId, online, status) => {
            queryClient.setQueryData(['presence'], (old = {}) => ({
                ...old, [userId]: { online, status }
            }));
        });

        return () => {
            onPresenceChange(null);
        };
    }, [queryClient]);
}

export function useUserStatus(userId) {
    const { data: statuses = {} } = useQuery({
        queryKey: ['presence'],
        queryFn: () => ({}),
        staleTime: Infinity,
    });

    return statuses[userId]?.status;
}

export function useIsOnline(userId) {
    const { data: presence = {} } = useQuery({
        queryKey: ['presence'],
        queryFn: () => ({}),
        staleTime: Infinity,
    });

    return presence[userId]?.online;
}