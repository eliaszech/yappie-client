import { useEffect } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { getSocket } from '../services/socket';

export function usePresence() {
    const queryClient = useQueryClient();

    useEffect(() => {
        const socket = getSocket();
        if (!socket) return;

        socket.on('user:online', ({ userId }) => {
            console.log('User online:', userId);
            queryClient.setQueryData(['presence'], (old = {}) => ({
                ...old, [userId]: true
            }));
        });

        socket.on('user:offline', ({ userId }) => {
            console.log('User offline:', userId);
            queryClient.setQueryData(['presence'], (old = {}) => ({
                ...old, [userId]: false
            }));
        });

        return () => {
            socket.off('user:online');
            socket.off('user:offline');
        };
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