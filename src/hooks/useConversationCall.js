import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchActiveCall } from "../services/api.js";
import { onCallEvent } from "../services/socket.js";

const KEY = (cid) => ['conversation-call', cid];

// Active-call snapshot for a single conversation. Returns { participants[],
// ringing, startedBy, startedAt } or null when no call is in progress.
// voice:join / voice:leave for conversation rooms patches the same cache key
// from useVoiceEvents, so the banner always sees fresh state.
export function useConversationCall(conversationId) {
    const { data: call = null } = useQuery({
        queryKey: KEY(conversationId),
        queryFn: () => fetchActiveCall(conversationId),
        enabled: !!conversationId,
        staleTime: Infinity,
    });

    return call;
}

// Mounts the call:* event listener once, mirroring backend ring/accept/end
// signals into the per-conversation call cache.
export function useCallEventsSync() {
    const queryClient = useQueryClient();

    useEffect(() => {
        onCallEvent((kind, data) => {
            const cid = data?.conversationId;
            if (!cid) return;

            if (kind === 'incoming') {
                queryClient.setQueryData(KEY(cid), (old) => ({
                    conversationId: cid,
                    startedBy: data.from?.id ?? null,
                    startedAt: Date.now(),
                    participants: data.from?.id ? [data.from.id] : [],
                    ringing: true,
                    incomingFrom: data.from ?? null,
                }));
            } else if (kind === 'accepted' || kind === 'ringTimeout') {
                queryClient.setQueryData(KEY(cid), (old) => old ? { ...old, ringing: false } : old);
            } else if (kind === 'ended') {
                queryClient.setQueryData(KEY(cid), null);
            }
        });

        return () => onCallEvent(null);
    }, [queryClient]);
}
