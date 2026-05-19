import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    fetchReadStates,
    markChannelRead as markChannelReadApi,
    markConversationRead as markConversationReadApi,
    markChannelUnread as markChannelUnreadApi,
    markConversationUnread as markConversationUnreadApi,
} from '../services/api.js';
import { getSocket } from '../services/socket.js';
import { useAuth } from './useAuth.js';

const READ_STATES_KEY = ['readStates'];

function emptyReadStates() {
    return { channels: [], conversations: [] };
}

function normalize(data) {
    if (!data || !Array.isArray(data.channels) || !Array.isArray(data.conversations)) {
        return emptyReadStates();
    }
    return data;
}

export function useReadStatesQuery() {
    const { user } = useAuth();
    return useQuery({
        queryKey: READ_STATES_KEY,
        queryFn: fetchReadStates,
        enabled: !!user,
        staleTime: Infinity,
        select: normalize,
    });
}

export function useReadStates() {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    useReadStatesQuery();

    useEffect(() => {
        if (!user) return;
        const socket = getSocket();
        if (!socket) return;

        function handleMessage(message) {
            if (message.userId === user.id) return;

            queryClient.setQueryData(READ_STATES_KEY, (old) => {
                const data = normalize(old);

                if (message.channelId) {
                    const mentioned = (message.mentions || []).some(
                        (m) => m.user?.id === user.id || m.userId === user.id,
                    ) || message.mentionEveryone || message.mentionHere;
                    const idx = data.channels.findIndex((c) => c.channelId === message.channelId);
                    if (idx === -1) return data;
                    const next = data.channels.slice();
                    next[idx] = {
                        ...next[idx],
                        unreadCount: next[idx].unreadCount + 1,
                        mentionCount: next[idx].mentionCount + (mentioned ? 1 : 0),
                    };
                    return { ...data, channels: next };
                }

                if (message.conversationId) {
                    const idx = data.conversations.findIndex(
                        (c) => c.conversationId === message.conversationId,
                    );
                    if (idx === -1) {
                        return {
                            ...data,
                            conversations: [
                                ...data.conversations,
                                {
                                    conversationId: message.conversationId,
                                    lastReadAt: new Date(0).toISOString(),
                                    unreadCount: 1,
                                },
                            ],
                        };
                    }
                    const next = data.conversations.slice();
                    next[idx] = { ...next[idx], unreadCount: next[idx].unreadCount + 1 };
                    return { ...data, conversations: next };
                }

                return data;
            });
        }

        socket.on('message:new', handleMessage);
        return () => {
            socket.off('message:new', handleMessage);
        };
    }, [queryClient, user]);
}

export async function markChannelAsRead(queryClient, channelId) {
    const data = normalize(queryClient.getQueryData(READ_STATES_KEY));
    const entry = data.channels.find((c) => c.channelId === channelId);
    if (entry && entry.unreadCount === 0 && entry.mentionCount === 0) return;

    queryClient.setQueryData(READ_STATES_KEY, (old) => {
        const cur = normalize(old);
        return {
            ...cur,
            channels: cur.channels.map((c) =>
                c.channelId === channelId
                    ? { ...c, unreadCount: 0, mentionCount: 0, lastReadAt: new Date().toISOString() }
                    : c,
            ),
        };
    });

    await markChannelReadApi(channelId);
}

export async function markConversationAsRead(queryClient, conversationId, userId) {
    const data = normalize(queryClient.getQueryData(READ_STATES_KEY));
    const entry = data.conversations.find((c) => c.conversationId === conversationId);
    if (entry && entry.unreadCount === 0) return;

    queryClient.setQueryData(READ_STATES_KEY, (old) => {
        const cur = normalize(old);
        return {
            ...cur,
            conversations: cur.conversations.map((c) =>
                c.conversationId === conversationId
                    ? { ...c, unreadCount: 0, lastReadAt: new Date().toISOString() }
                    : c,
            ),
        };
    });

    if (userId) {
        queryClient.setQueryData(['conversations', userId], (old) => {
            if (!Array.isArray(old)) return old;
            return old.map((conv) =>
                conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv,
            );
        });
    }

    await markConversationReadApi(conversationId);
}

// Push lastReadAt back so the target message (and everything after) counts as
// unread. Backend recomputes and returns the new counts; we just patch them in.
export async function markChannelAsUnread(queryClient, channelId, messageId) {
    const res = await markChannelUnreadApi(channelId, messageId);
    if (res?.error) return;
    queryClient.setQueryData(READ_STATES_KEY, (old) => {
        const cur = normalize(old);
        const idx = cur.channels.findIndex((c) => c.channelId === channelId);
        if (idx === -1) return cur;
        const next = cur.channels.slice();
        next[idx] = {
            ...next[idx],
            unreadCount: res.unreadCount,
            mentionCount: res.mentionCount,
            lastReadAt: res.lastReadAt,
        };
        return { ...cur, channels: next };
    });
}

export async function markConversationAsUnread(queryClient, conversationId, messageId, userId) {
    const res = await markConversationUnreadApi(conversationId, messageId);
    if (res?.error) return;
    queryClient.setQueryData(READ_STATES_KEY, (old) => {
        const cur = normalize(old);
        const idx = cur.conversations.findIndex((c) => c.conversationId === conversationId);
        if (idx === -1) return cur;
        const next = cur.conversations.slice();
        next[idx] = { ...next[idx], unreadCount: res.unreadCount, lastReadAt: res.lastReadAt };
        return { ...cur, conversations: next };
    });
    if (userId) {
        queryClient.setQueryData(['conversations', userId], (old) => {
            if (!Array.isArray(old)) return old;
            return old.map((conv) =>
                conv.id === conversationId ? { ...conv, unreadCount: res.unreadCount } : conv,
            );
        });
    }
}

export function useChannelUnread(channelId) {
    const { data } = useReadStatesQuery();
    const entry = data?.channels?.find((c) => c.channelId === channelId);
    return {
        unreadCount: entry?.unreadCount ?? 0,
        mentionCount: entry?.mentionCount ?? 0,
    };
}

export function useConversationUnread(conversationId) {
    const { data } = useReadStatesQuery();
    const entry = data?.conversations?.find((c) => c.conversationId === conversationId);
    return { unreadCount: entry?.unreadCount ?? 0 };
}

export function useServerUnread(serverId) {
    const { data } = useReadStatesQuery();
    const channels = (data?.channels || []).filter((c) => c.serverId === serverId);
    const unreadCount = channels.reduce((sum, c) => sum + c.unreadCount, 0);
    const mentionCount = channels.reduce((sum, c) => sum + c.mentionCount, 0);
    return { unreadCount, mentionCount, hasUnread: unreadCount > 0 };
}
