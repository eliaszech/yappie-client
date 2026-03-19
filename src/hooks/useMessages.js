import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { onNewMessage } from '../services/socket';
import { useAuth } from './useAuth';
import {playMessageSound} from "../services/sounds.js";

export function useMessages() {
    const queryClient = useQueryClient();
    const { user } = useAuth()

    useEffect(() => {
        onNewMessage((message) => {
            const roomId = message.conversationId || message.channelId;

            if(message.userId !== user.id && user.status !== 'dnd') {
                playMessageSound();
            }

            queryClient.setQueryData(['messages', roomId], (old) => {
                if (!old) return old;

                if (message.userId === user.id) {
                    const withoutTemp = old.messages.filter(m =>
                        !(m.pending && m.userId === user.id && m.text === message.text)
                    );

                    return {
                        ...old,
                        messages: [...withoutTemp, message],
                    };
                }

                return {
                    ...old,
                    messages: [...old.messages, message],
                };
            });

            if(message.conversationId) {
                // Conversations-Liste updaten und sortieren
                queryClient.setQueryData(['conversations', user?.id], (old) => {
                    if (!old) return old;
                    return old.map(conv => {
                        if (conv.id === message.conversationId && message.userId !== user.id) {
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