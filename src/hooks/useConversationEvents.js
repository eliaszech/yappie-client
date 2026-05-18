import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { onConversationCreated } from '../services/socket.js';
import { useAuth } from './useAuth.js';

export function useConversationEvents() {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    useEffect(() => {
        if (!user) return;

        onConversationCreated((conversation) => {
            queryClient.setQueryData(['conversations', user.id], (old) => {
                if (!Array.isArray(old)) return old;
                if (old.some((c) => c.id === conversation.id)) return old;
                return [conversation, ...old];
            });

            queryClient.setQueryData(['readStates'], (old) => {
                if (!old) return old;
                if (old.conversations.some((c) => c.conversationId === conversation.id)) return old;
                return {
                    ...old,
                    conversations: [
                        ...old.conversations,
                        {
                            conversationId: conversation.id,
                            lastReadAt: new Date().toISOString(),
                            unreadCount: 0,
                        },
                    ],
                };
            });
        });

        return () => onConversationCreated(null);
    }, [queryClient, user]);
}
