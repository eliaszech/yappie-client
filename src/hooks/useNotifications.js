import { useEffect, useRef } from 'react';
import { getSocket } from '../services/socket.js';
import { useAuth } from './useAuth.js';
import { useUserStatus } from './usePresence.js';
import { ensureNotificationPermission, fireNotification } from '../services/notifications.js';
import { fetchChannel } from '../services/api.js';

function getCurrentHashPath() {
    const hash = window.location.hash.replace(/^#/, '');
    return hash.split('?')[0] || '/';
}

function navigateHash(path) {
    window.location.hash = path;
}

export function useNotifications() {
    const { user } = useAuth();
    const liveStatus = useUserStatus(user?.id);
    const statusRef = useRef(liveStatus ?? user?.status);

    useEffect(() => {
        statusRef.current = liveStatus ?? user?.status;
    }, [liveStatus, user?.status]);

    useEffect(() => {
        if (!user) return;
        ensureNotificationPermission();

        const socket = getSocket();
        if (!socket) return;

        function handle(message) {
            if (!user || message.userId === user.id) return;
            if (statusRef.current === 'dnd') return;

            const isDM = !!message.conversationId;
            const mentioned = (message.mentions || []).some(
                (m) => m.user?.id === user.id || m.userId === user.id,
            );
            const isReplyToMe = message.replyTo && message.replyTo.user?.id === user.id;
            const isBroadcastMention = !!(message.mentionEveryone || message.mentionHere);
            if (!isDM && !mentioned && !isReplyToMe && !isBroadcastMention) return;

            const onActiveRoute = isDM
                ? getCurrentHashPath() === `/@me/messages/${message.conversationId}`
                : getCurrentHashPath().endsWith(`/channels/${message.channelId}`);

            if (onActiveRoute) return;

            const senderName = message.user?.displayName || message.user?.username || 'Neue Nachricht';
            const title = isDM
                ? senderName
                : `${senderName} (#${message.channel?.name ?? 'Channel'})`;

            fireNotification({
                title,
                body: message.text || (message.attachments?.length ? '(Anhang)' : ''),
                icon: message.user?.avatar || undefined,
                tag: isDM ? `dm-${message.conversationId}` : `ch-${message.channelId}`,
                onClick: async () => {
                    if (isDM) {
                        navigateHash(`/@me/messages/${message.conversationId}`);
                        return;
                    }
                    let serverId = message.channel?.serverId;
                    if (!serverId && message.channelId) {
                        try {
                            const ch = await fetchChannel(message.channelId);
                            serverId = ch?.serverId;
                        } catch {}
                    }
                    if (serverId && message.channelId) {
                        navigateHash(`/servers/${serverId}/channels/${message.channelId}`);
                    }
                },
            });
        }

        socket.on('message:new', handle);
        return () => {
            socket.off('message:new', handle);
        };
    }, [user]);
}
