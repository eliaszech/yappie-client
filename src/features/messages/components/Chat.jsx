import MessageItem from "./MessageItem.jsx";
import {useCallback, useEffect, useRef, useState} from "react";
import {useQuery} from "@tanstack/react-query";
import {fetchMessages} from "../../../services/api.js";
import Spinner from "../../components/static/Spinner.jsx";
import ErrorMessage from "../../components/static/ErrorMessage.jsx";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faMessages} from "@awesome.me/kit-95376d5d61/icons/classic/light";

function Chat({children, type = 'conversation', roomId}) {
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const prevMessageCount = useRef(0);
    const scrollInitialized = useRef(false);

    const {data: messages, isLoading, isError} = useQuery({
        queryKey: ['messages', roomId],
        queryFn: () => fetchMessages(type, roomId),
        staleTime: 10 * 60 * 1000,
        retry: 1,
    })

    function isNearBottom() {
        const container = messagesContainerRef.current;
        if (!container) return true;
        const threshold = 100;
        return container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
    }

    useEffect(() => {
        if(!messages) return;
        const currentCount = messages?.length || 0;

        if (currentCount > prevMessageCount.current && isNearBottom()) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }

        if(!scrollInitialized.current) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            scrollInitialized.current = true;
        }

        prevMessageCount.current = currentCount;
    }, [messages?.length]);

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

    /*const messages = [...(data?.pages ?? [])]
        .reverse()
        .flatMap(page => page.messages);*/

    return (
        <div ref={messagesContainerRef} className="relative flex grow flex-col pb-8 overflow-y-auto">
            <div className="grow"></div>
            {children}
            { messages.length > 0 && messages.map((message, index) => {
                const previous = messages[index - 1];
                const isGrouped = shouldGroupMessage(message, previous);
                const shouldPrependDate = shouldPrependDateLine(message, previous);

                return (
                    <div key={message.id}>
                        { shouldPrependDate && (
                            <div className="text-center flex justify-center text-foreground/80 my-6 mx-8 relative">
                                <div className="absolute top-1/2 h-[2px] w-full bg-border z-0"></div>
                                <div className="z-2 w-max px-4 bg-background">{new Date(message.createdAt).toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric'})}</div>
                            </div>
                        )}
                        <MessageItem isGrouped={isGrouped} message={message} />
                    </div>
                )
            })}
            <div ref={messagesEndRef} />
        </div>
    )
}

export default Chat;