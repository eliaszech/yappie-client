import MessageItem from "./MessageItem.jsx";
import {useEffect, useMemo, useRef, useState} from "react";
import {useQuery, useQueryClient} from "@tanstack/react-query";
import {fetchMessages} from "../../../services/api.js";
import Spinner from "../../components/static/Spinner.jsx";
import ErrorMessage from "../../components/static/ErrorMessage.jsx";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faMessages} from "@awesome.me/kit-95376d5d61/icons/classic/light";
import {faArrowDown} from "@awesome.me/kit-95376d5d61/icons/classic/solid";
import {useAuth} from "../../../hooks/useAuth.js";
import {markChannelAsRead, markConversationAsRead} from "../../../hooks/useReadStates.js";

function Chat({children, type = 'conversation', roomId}) {
    const {user} = useAuth();
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const isAtBottomRef = useRef(true);
    const lastSeenMessageIdRef = useRef(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasNewMessages, setHasNewMessages] = useState(false);
    const [unreadMarker, setUnreadMarker] = useState(null);
    const queryClient = useQueryClient();

    const {data: messages, isLoading, isError} = useQuery({
        queryKey: ['messages', roomId],
        queryFn: () => fetchMessages(type, roomId),
        select: (data) => data.messages,
        staleTime: 10 * 60 * 1000,
        retry: 1,
    })

    function checkIsAtBottom() {
        const c = messagesContainerRef.current;
        const e = messagesEndRef.current;
        if(!c || !e) return true;
        const cRect = c.getBoundingClientRect();
        const eRect = e.getBoundingClientRect();
        return (eRect.top - cRect.bottom) < 60;
    }

    function scrollToBottom(smooth = true) {
        const c = messagesContainerRef.current;
        if(!c) return;
        c.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' });
    }

    async function fetchOlderMessages() {
        const queryData = queryClient.getQueryData(['messages', roomId]);

        if(queryData && queryData.nextCursor) {
            const cursor = queryData.nextCursor;
            setLoadingMore(true);
            const moreMessages = await fetchMessages(type, roomId, cursor);

            queryClient.setQueryData(['messages', roomId], (old) => {
                return {
                    ...old,
                    messages: [...moreMessages.messages, ...old.messages],
                    nextCursor: moreMessages.nextCursor,
                }
            })

            setLoadingMore(false);
        }
    }

    useEffect(() => {
        setHasNewMessages(false);
        isAtBottomRef.current = true;
        lastSeenMessageIdRef.current = null;
    }, [roomId]);

    useEffect(() => {
        if (!roomId) return;

        // Snapshot des lastReadAt VOR dem markRead-Call, damit die Trennlinie
        // an Ort und Stelle bleibt während wir den Channel als gelesen markieren.
        const rs = queryClient.getQueryData(['readStates']);
        const list = type === 'channel' ? rs?.channels : rs?.conversations;
        const idKey = type === 'channel' ? 'channelId' : 'conversationId';
        const entry = Array.isArray(list) ? list.find(c => c[idKey] === roomId) : null;
        setUnreadMarker(entry?.lastReadAt ?? null);

        function markRead() {
            if (type === 'channel') markChannelAsRead(queryClient, roomId);
            else if (type === 'conversation') markConversationAsRead(queryClient, roomId, user?.id);
        }

        markRead();

        function onFocus() {
            if (document.visibilityState === 'visible') markRead();
        }
        window.addEventListener('focus', onFocus);
        document.addEventListener('visibilitychange', onFocus);
        return () => {
            window.removeEventListener('focus', onFocus);
            document.removeEventListener('visibilitychange', onFocus);
        };
    }, [roomId, type, queryClient, user?.id]);

    useEffect(() => {
        if(!messagesContainerRef.current) return;
        const messagesContainer = messagesContainerRef.current;

        async function handleScroll() {
            const atBottom = checkIsAtBottom();
            isAtBottomRef.current = atBottom;
            if(atBottom) setHasNewMessages(false);

            if(Math.abs(messagesContainer.scrollTop) === (messagesContainer.scrollHeight - messagesContainer.clientHeight)) {
                await fetchOlderMessages();
            }
        }

        messagesContainer.addEventListener('scroll', handleScroll)
        return () => {
            messagesContainer.removeEventListener('scroll', handleScroll)
        }
    }, [fetchOlderMessages, roomId])

    useEffect(() => {
        if(!messages || messages.length === 0) return;
        const newest = messages[messages.length - 1];

        if(lastSeenMessageIdRef.current === null) {
            lastSeenMessageIdRef.current = newest.id;
            return;
        }

        if(lastSeenMessageIdRef.current === newest.id) return;

        lastSeenMessageIdRef.current = newest.id;

        const atBottom = checkIsAtBottom();
        isAtBottomRef.current = atBottom;

        if(newest.userId === user?.id) {
            setHasNewMessages(false);
            scrollToBottom(true);
            return;
        }

        if(atBottom) {
            scrollToBottom(true);
            if (document.visibilityState === 'visible' && document.hasFocus()) {
                if (type === 'channel') markChannelAsRead(queryClient, roomId);
                else if (type === 'conversation') markConversationAsRead(queryClient, roomId, user?.id);
            }
        } else {
            setHasNewMessages(true);
        }
    }, [messages, user?.id, type, roomId, queryClient]);



    const firstUnreadId = useMemo(() => {
        if (!unreadMarker || !messages || messages.length === 0) return null;
        const marker = new Date(unreadMarker).getTime();
        const found = messages.find(m =>
            new Date(m.createdAt).getTime() > marker && m.userId !== user?.id
        );
        return found?.id ?? null;
    }, [unreadMarker, messages, user?.id]);

    function shouldPrependDateLine(current, previous) {
        if (!previous) return true;
        return new Date(current.createdAt).getDate() !== new Date(previous.createdAt).getDate();
    }

    function shouldGroupMessage(current, previous) {
        if (!previous) return false;
        if (current.userId !== previous.userId) return false;

        const timeDiff = new Date(current.createdAt) - new Date(previous.createdAt);
        const oneHour = 60 * 60 * 1000;

        return timeDiff < oneHour;
    }

    if(isLoading /*|| isFetchingNextPage*/) return <Spinner size="w-10 h-10" />
    if(isError) return <ErrorMessage title="Nachrichten laden" message="Nachrichten konnten nicht geladen werden" icon={<FontAwesomeIcon icon={faMessages} />} />

    return (
        <div className="relative flex grow flex-col overflow-hidden">
            { hasNewMessages && (
                <button
                    onClick={() => { setHasNewMessages(false); scrollToBottom(true); }}
                    className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-sm shadow-md hover:bg-primary/90 cursor-pointer"
                >
                    <FontAwesomeIcon icon={faArrowDown} />
                    Neue Nachrichten
                </button>
            )}
            <div
                ref={messagesContainerRef}
                className="flex grow flex-col-reverse pb-8 pt-12 overflow-y-auto"
                style={{
                    maskImage: 'linear-gradient(to top, transparent 0, black 32px)',
                    WebkitMaskImage: 'linear-gradient(to top, transparent 0, black 32px)',
                }}
            >
                <div ref={messagesEndRef} />
                { messages.length > 0 && [...messages].reverse().map((message, index, reversed) => {
                    const previous = reversed[index + 1];
                    const isGrouped = shouldGroupMessage(message, previous);
                    const shouldPrependDate = shouldPrependDateLine(message, previous);

                    const showUnreadMarker = message.id === firstUnreadId;
                    return (
                        <div key={message.id}>
                            { shouldPrependDate && (
                                <div className="text-center flex justify-center text-foreground/80 my-6 mx-8 relative">
                                    <div className="absolute top-1/2 h-[2px] w-full bg-border z-0"></div>
                                    <div className="z-2 w-max px-4 bg-background">{new Date(message.createdAt).toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric'})}</div>
                                </div>
                            )}
                            { showUnreadMarker && (
                                <div className="flex items-center mx-4 my-2 relative">
                                    <div className="flex-1 h-[1px] bg-dnd/70"></div>
                                    <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-dnd bg-background">Neu</span>
                                    <div className="h-[1px] w-4 bg-dnd/70"></div>
                                </div>
                            )}
                            <MessageItem isGrouped={showUnreadMarker ? false : isGrouped} message={message} />
                        </div>
                    )
                })}
                {children}
                <div className="grow"></div>
            </div>
        </div>
    )
}

export default Chat;