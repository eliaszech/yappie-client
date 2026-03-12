import {getSocket} from "../../../services/socket.js";
import {useEffect, useRef, useState} from "react";
import {useTyping} from "../../../hooks/useTyping.js";
import {useQueryClient} from "@tanstack/react-query";
import {useAuth} from "../../../hooks/useAuth.js";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faArrowTurnRight, faFaceSmile, faPlus, faTimesCircle} from "@awesome.me/kit-95376d5d61/icons/classic/solid";
import {useReplyState} from "../../../hooks/messages/useReplyState.js";
import HasEmojiPicker from "./HasEmojiPicker.jsx";

function MessageInput({roomName, type = 'conversation', roomId}) {
    const {user} = useAuth();
    const [input, setInput] = useState('');
    const queryClient = useQueryClient();
    const { replyTo, clearReplyState } = useReplyState(roomId);
    const { typingUsers, sendTyping, stopTyping } = useTyping(type, roomId);
    const inputRef = useRef(null);

    useEffect(() => {
        if(!replyTo) return
        inputRef.current.focus();
    }, [replyTo]);

    function sendMessage() {
        if (!input.trim()) return;
        const socket = getSocket();

        const tempMessage = {
            id: `temp-${Date.now()}`,
            text: input,
            userId: user.id,
            user: user,
            roomId,
            createdAt: new Date().toISOString(),
            pending: true,
        };

        // Sofort in den Cache
        queryClient.setQueryData([type, roomId], (old) => {
            if (!old) return old;
            return {
                ...old,
                messages: [...old.messages, tempMessage]
            };
        });

        socket.emit('message:send', {
            type, roomId,
            text: input,
            replyToId: replyTo?.id || null,
        });
        setInput('');
        clearReplyState();
    }

    const typingUsersString = typingUsers.map((typingUser) => typingUser.username).join(', ');
    const roomNamePrefix = type === 'conversation' ? '' : '#';

    return (
        <div className="relative flex flex-col px-1.5 pb-2 z-3">
            { typingUsers.length > 0 && (
                <div className="absolute animate animate-pulse -top-6 rounded-lg text-xs bg-transparent text-foreground w-full px-2 py-1">{typingUsersString} is typing...</div>
            )}
            <div className="flex flex-col items-center relative bg-card rounded-lg border border-border">
                { replyTo && (
                    <div className="flex w-full justify-between items-center rounded-t-lg border-b border-border px-4 py-2 bg-guild-bar">
                        <div className="text-xs  text-foreground w-full">
                            <FontAwesomeIcon className="mr-1" icon={faArrowTurnRight} />
                            Replying to <b>{replyTo.user.username}</b>: <span className="text-foreground">{replyTo.text}</span>
                        </div>
                        <button onClick={() => clearReplyState()} className="text-foreground cursor-pointer"><FontAwesomeIcon icon={faTimesCircle} /></button>
                    </div>
                )}
                <div className="flex w-full items-center relative">
                    <button className="absolute z-10 left-3 cursor-pointer text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg px-1 py-1">
                        <FontAwesomeIcon icon={faPlus} className="" />
                    </button>
                    <input ref={inputRef} type="text" className="w-full pl-12 pr-12 h-[56px] text-foreground placeholder:text-muted-foreground! outline-none rounded-lg shadow-sm bg-card focus:ring-2 focus:ring-primary/80 transition-colors"
                       placeholder={`Nachricht an ${roomNamePrefix}${roomName} schreiben...`}
                       value={input} onChange={(e) => {
                            setInput(e.target.value)
                            sendTyping();
                        }}
                       onKeyDown={e => {
                           if(e.key === 'Enter') {
                               sendMessage();
                               stopTyping();
                           }
                       }}
                    />
                    <div className="absolute right-3 z-10 h-full flex items-center gap-2">
                        <HasEmojiPicker position="top" orientation="right" onSelect={(emoji) => setInput(prev => prev + emoji)}>
                            <button className="cursor-pointer text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg px-1 py-1">
                                <FontAwesomeIcon icon={faFaceSmile} />
                            </button>
                        </HasEmojiPicker>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default MessageInput;