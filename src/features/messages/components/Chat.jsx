import MessageItem from "./MessageItem.jsx";
import {useEffect, useRef} from "react";

function Chat({children, messages}) {
    const messagesEndRef = useRef(null);

    useEffect(() => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    }, [messages]);

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

    return (
        <div className="relative flex grow flex-col pb-8 overflow-y-auto">
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