import { useEffect } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { onActivityChange, onActivitySync, getSocket } from '../services/socket.js';

// Subscribes to activity updates from the socket and mirrors them into the
// react-query cache so the UI re-renders on change. Mount once at app level.
export function useActivitySubscription() {
    const queryClient = useQueryClient();

    useEffect(() => {
        onActivityChange(({ userId, activity }) => {
            queryClient.setQueryData(['activities'], (old = {}) => {
                if (!activity) {
                    if (!(userId in old)) return old;
                    const next = { ...old };
                    delete next[userId];
                    return next;
                }
                return { ...old, [userId]: activity };
            });
        });

        onActivitySync((snapshot) => {
            queryClient.setQueryData(['activities'], snapshot ?? {});
        });

        return () => {
            onActivityChange(null);
            onActivitySync(null);
        };
    }, [queryClient]);
}

export function useUserActivity(userId) {
    const { data: activities = {} } = useQuery({
        queryKey: ['activities'],
        queryFn: () => ({}),
        staleTime: Infinity,
    });
    return activities[userId] ?? null;
}

// Bridges electron's game detection IPC to a server-side activity:set emit.
// No-op outside of electron. Handles the case where the socket doesn't exist
// yet at mount (user not logged in) by polling for it, and re-emits on every
// reconnect so the in-memory backend state stays in sync.
export function useGameActivityReporter() {
    useEffect(() => {
        const api = typeof window !== 'undefined' ? window.electronAPI : null;
        if (!api || !api.onGameDetected) return;

        let pending = null;
        let attachedSocket = null;

        function flush() {
            const s = getSocket();
            if (!s || !s.connected) return false;
            s.emit('activity:set', { name: pending });
            return true;
        }

        function attachConnectHandler() {
            const s = getSocket();
            if (!s || s === attachedSocket) return;
            attachedSocket = s;
            s.on('connect', flush);
            if (s.connected) flush();
        }

        api.onGameDetected((game) => {
            pending = game ?? null;
            attachConnectHandler();
            flush();
        });

        api.getCurrentGame?.().then((game) => {
            // Always emit on (re)load — even null — so a stale entry left in
            // the backend's in-memory map (e.g. crash, force-quit) gets cleared.
            pending = game ?? null;
            attachConnectHandler();
            flush();
        }).catch(() => {});

        // Poll for socket existence (created after login); stop once attached.
        const poll = setInterval(() => {
            attachConnectHandler();
            if (attachedSocket) clearInterval(poll);
        }, 1000);

        return () => {
            clearInterval(poll);
            if (attachedSocket) attachedSocket.off('connect', flush);
        };
    }, []);
}
