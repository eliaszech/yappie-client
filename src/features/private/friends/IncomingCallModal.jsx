import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPhone, faPhoneSlash } from "@awesome.me/kit-95376d5d61/icons/classic/solid";
import UserAvatar from "../../components/UserAvatar.jsx";
import { useVoice } from "../../../hooks/useVoice.jsx";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { startRingtone, stopRingtone } from "../../../services/sounds.js";

// Global incoming-call modal. Listens to call:incoming via a *secondary*
// subscription path: useCallEventsSync is the canonical onCallEvent handler,
// so we hook into the same query cache it patches.
// Strategy: we read all `['conversation-call', *]` entries that are ringing
// and not started by us, and render the most recent one as the modal.
export default function IncomingCallModal() {
    const queryClient = useQueryClient();
    const { joinVoice, conversationId: activeId, muted, deafened } = useVoice();
    const navigate = useNavigate();
    const [, setTick] = useState(0);
    const pendingBumpRef = useRef(false);

    // Trigger re-renders when conversation-call cache entries change. The
    // cache notification fires synchronously inside setQueryData, which is
    // itself sometimes called from inside another component's render
    // (CallBanner reading useQuery → cache write on hydrate). Deferring via
    // queueMicrotask moves our setState out of that render frame so React
    // doesn't warn about "setState while rendering a different component".
    useEffect(() => {
        function refresh() {
            if (pendingBumpRef.current) return;
            pendingBumpRef.current = true;
            queueMicrotask(() => {
                pendingBumpRef.current = false;
                setTick(t => t + 1);
            });
        }
        const unsub = queryClient.getQueryCache().subscribe((event) => {
            const key = event?.query?.queryKey;
            if (Array.isArray(key) && key[0] === 'conversation-call') refresh();
        });
        return unsub;
    }, [queryClient]);

    // Find the currently ringing call we're invited to.
    const ringingCalls = queryClient.getQueryCache().findAll({ queryKey: ['conversation-call'] })
        .map(q => q.state.data)
        .filter(Boolean)
        .filter(c => c.ringing && c.conversationId && c.conversationId !== activeId);

    const incoming = ringingCalls[0] ?? null;

    useEffect(() => {
        if (incoming) startRingtone();
        else stopRingtone();
        return () => stopRingtone();
    }, [incoming?.conversationId]);

    if (!incoming) return null;
    const from = incoming.incomingFrom ?? { username: 'Unbekannt' };

    function accept() {
        joinVoice({
            conversation: { id: incoming.conversationId, name: from.username },
            attributes: { muted, deafened },
        });
        navigate(`/@me/messages/${incoming.conversationId}`);
        stopRingtone();
    }

    function decline() {
        // Mark the local call cache as non-ringing so the modal disappears;
        // backend keeps the ring until timeout. If we want a real "decline"
        // signal later, we'd add a socket event for it.
        queryClient.setQueryData(['conversation-call', incoming.conversationId], (old) =>
            old ? { ...old, ringing: false } : old
        );
        stopRingtone();
    }

    return createPortal((
        <div className="fixed inset-0 z-[400] flex items-center justify-center pointer-events-none">
            <div className="pointer-events-auto bg-card border border-border rounded-2xl shadow-2xl w-[22rem] p-6 flex flex-col items-center gap-4 animate-pulse-once">
                <UserAvatar
                    size="w-20 h-20 text-3xl"
                    displayOnline={false}
                    avatar={from.avatar}
                    icon={(from.username ?? '?').charAt(0).toUpperCase()}
                />
                <div className="flex flex-col items-center gap-1 text-center">
                    <span className="text-base font-semibold text-foreground">
                        {from.username ?? 'Unbekannt'}
                    </span>
                    <span className="text-xs text-muted-foreground">Eingehender Anruf…</span>
                </div>
                <div className="flex gap-4 mt-2">
                    <button
                        onClick={decline}
                        title="Ablehnen"
                        className="cursor-pointer w-14 h-14 flex items-center justify-center rounded-full bg-dnd text-white hover:bg-dnd/80 transition-colors shadow-lg"
                    >
                        <FontAwesomeIcon icon={faPhoneSlash} className="text-xl" />
                    </button>
                    <button
                        onClick={accept}
                        title="Annehmen"
                        className="cursor-pointer w-14 h-14 flex items-center justify-center rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors shadow-lg"
                    >
                        <FontAwesomeIcon icon={faPhone} className="text-xl" />
                    </button>
                </div>
            </div>
        </div>
    ), document.body);
}
