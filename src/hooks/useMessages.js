import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { onNewMessage } from '../services/socket';
import { useAuth } from './useAuth';
import {playMessageSound} from "../services/sounds.js";

function getCurrentPath() {
    const hash = window.location.hash.replace(/^#/, '');
    return hash.split('?')[0] || '/';
}

export function useMessages() {
    const queryClient = useQueryClient();
    const { user } = useAuth()

    useEffect(() => {
        onNewMessage((message) => {
            const roomId = message.conversationId || message.channelId;
            const isInThisConversation = message.conversationId
                && getCurrentPath() === `/@me/messages/${message.conversationId}`;

            if(message.userId !== user.id && user.status !== 'dnd') {
                playMessageSound();
            }

            queryClient.setQueryData(['messages', roomId], (old) => {
                if (!old) return old;

                // Defensive de-dup: drop any existing entry with the same id
                // so a duplicated `message:new` (e.g. system messages emitted
                // alongside call lifecycle events) can never produce two
                // children with the same React key.
                const withoutDup = old.messages.filter(m => m.id !== message.id);

                if (message.userId === user.id) {
                    const withoutTemp = withoutDup.filter(m =>
                        !(m.pending && m.userId === user.id && m.text === message.text)
                    );

                    return {
                        ...old,
                        messages: [...withoutTemp, message],
                    };
                }

                return {
                    ...old,
                    messages: [...withoutDup, message],
                };
            });

            if(message.conversationId) {
                // Conversations-Liste updaten und sortieren
                queryClient.setQueryData(['conversations', user?.id], (old) => {
                    if (!old) return old;
                    return old.map(conv => {
                        if (conv.id === message.conversationId && message.userId !== user.id && !isInThisConversation) {
                            return {...conv, unreadCount: (conv.unreadCount || 0) + 1, messages: [message]};
                        }
                        if (conv.id === message.conversationId) {
                            return {...conv, messages: [message]};
                        }
                        return conv;
                    }).sort((a, b) => {
                        const aDate = a.messages[0]?.createdAt ?? a.createdAt;
                        const bDate = b.messages[0]?.createdAt ?? b.createdAt;
                        return new Date(bDate).getTime() - new Date(aDate).getTime();
                    });
                });
            }
        });

        return () => onNewMessage(null);
    }, [queryClient, user]);
}