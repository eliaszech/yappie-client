import { useEffect } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { onActivityChange, onActivitySync, getSocket } from '../services/socket.js';
import { getActivityEnabled, getCustomGames, subscribe as subscribeActivitySettings } from '../services/activitySettings.js';

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

        function normalize(game) {
            if (!game) return null;
            if (typeof game === 'string') return { name: game, icon: null };
            return { name: game.name ?? null, icon: game.icon ?? null };
        }

        function flush() {
            const s = getSocket();
            if (!s || !s.connected) return false;
            s.emit('activity:set', pending ? { name: pending.name, icon: pending.icon } : { name: null });
            return true;
        }

        function attachConnectHandler() {
            const s = getSocket();
            if (!s || s === attachedSocket) return;
            attachedSocket = s;
            s.on('connect', flush);
            if (s.connected) flush();
        }

        // Push the current settings down to main so detection respects them
        // from the start (and re-push on every change). Enabled flag goes
        // first so the custom-games update can't trigger a stray emit while
        // the user is in the process of disabling sharing.
        function syncSettingsToMain() {
            api.setActivityEnabled?.(getActivityEnabled());
            api.setCustomGames?.(getCustomGames());
        }
        syncSettingsToMain();
        const unsubSettings = subscribeActivitySettings(() => {
            syncSettingsToMain();
            // If the user disables sharing while a game is detected, the main
            // process emits null via onGameDetected — that already flushes.
            // If they re-enable, main will emit the current game next tick.
        });

        api.onGameDetected((game) => {
            pending = normalize(game);
            attachConnectHandler();
            flush();
        });

        api.getCurrentGame?.().then((game) => {
            // Always emit on (re)load — even null — so a stale entry left in
            // the backend's in-memory map (e.g. crash, force-quit) gets cleared.
            pending = normalize(game);
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
            unsubSettings();
            if (attachedSocket) attachedSocket.off('connect', flush);
        };
    }, []);
}
