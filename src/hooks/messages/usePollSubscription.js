import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { onPollUpdate } from "../../services/socket.js";

// Server pushes `poll:update` whenever any vote changes; we patch the cached
// message (in whichever conversation/channel it belongs to) so the UI updates
// without an extra fetch.
export function usePollSubscription() {
    const queryClient = useQueryClient();

    useEffect(() => {
        onPollUpdate(({ messageId, poll }) => {
            if (!messageId || !poll) return;

            const caches = queryClient.getQueriesData({ queryKey: ['messages'] });
            for (const [key, data] of caches) {
                if (!data?.messages) continue;
                const has = data.messages.some(m => m.id === messageId);
                if (!has) continue;
                queryClient.setQueryData(key, {
                    ...data,
                    messages: data.messages.map(m =>
                        m.id === messageId ? { ...m, poll } : m
                    ),
                });
            }
        });
    }, [queryClient]);
}
