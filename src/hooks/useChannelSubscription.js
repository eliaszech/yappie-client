import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { onChannelChange } from '../services/socket.js';

// Keeps the local channels cache in sync with backend channel mutations.
// Created/updated/deleted are merged in place; positions replaces the full
// ordered list emitted by the server.
export function useChannelSubscription() {
    const queryClient = useQueryClient();

    useEffect(() => {
        onChannelChange((kind, data) => {
            const serverId = data?.serverId;
            if (!serverId) return;

            if (kind === 'created') {
                queryClient.setQueryData(['channels', serverId], (old) => {
                    if (!Array.isArray(old)) return old;
                    if (old.some(c => c.id === data.channel.id)) return old;
                    return [...old, data.channel];
                });
            } else if (kind === 'updated') {
                // Merge instead of replace — the backend's channel:updated
                // payload comes straight from prisma.channel.update and has
                // no `permissions` field (that's resolved per-user only in
                // GET /channels). Overwriting wholesale would drop the
                // effective-permission mask and hide UI like the gear icon
                // until the next refetch.
                queryClient.setQueryData(['channels', serverId], (old) =>
                    Array.isArray(old)
                        ? old.map(c => c.id === data.channel.id ? { ...c, ...data.channel } : c)
                        : old
                );
            } else if (kind === 'deleted') {
                queryClient.setQueryData(['channels', serverId], (old) =>
                    Array.isArray(old) ? old.filter(c => c.id !== data.channelId) : old
                );
            } else if (kind === 'positions') {
                if (Array.isArray(data.channels)) {
                    queryClient.setQueryData(['channels', serverId], data.channels);
                }
            } else if (kind === 'overwrites') {
                // VIEW_CHANNEL on this channel may have changed for me — the
                // backend filters the list, so just refetch.
                queryClient.invalidateQueries({ queryKey: ['channels', serverId] });
                queryClient.invalidateQueries({ queryKey: ['channelOverwrites', data.channelId] });
            }
        });

        return () => onChannelChange(null);
    }, [queryClient]);
}
