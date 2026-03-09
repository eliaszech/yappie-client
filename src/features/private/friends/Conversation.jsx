import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faUsers} from "@awesome.me/kit-95376d5d61/icons/classic/regular";
import {useParams} from "react-router-dom";
import ContentHeader from "../../components/ContentHeader.jsx";
import {useQuery, useQueryClient} from "@tanstack/react-query";
import {fetchConversation} from "../../../services/api.js";
import ErrorMessage from "../../components/static/ErrorMessage.jsx";
import {faMessage, faMessages} from "@awesome.me/kit-95376d5d61/icons/classic/light";
import Spinner from "../../components/static/Spinner.jsx";
import UserAvatar from "../../components/UserAvatar.jsx";
import UserAvatarGroup from "../../components/UserAvatarGroup.jsx";
import {useEffect, useRef, useState} from "react";
import {getSocket} from "../../../services/socket.js";
import {useAuth} from "../../../hooks/useAuth.js";
import {useTyping} from "../../../hooks/useTyping.js";
import MessageItem from "../../messages/components/MessageItem.jsx";
import UserItem from "../../components/UserItem.jsx";
import NoResultsMessage from "../../components/static/NoResultsMessage.jsx";

function Conversation() {
    const {user} = useAuth();
    const { conversationId } = useParams();
    const [input, setInput] = useState('');
    const queryClient = useQueryClient();
    const messagesEndRef = useRef(null);
    const { typingUsers, sendTyping, stopTyping } = useTyping(conversationId);

    const { data: conversation = null, isLoading, isError } = useQuery( {
        queryKey: ['conversation', conversationId],
        queryFn: () => fetchConversation(conversationId),
        staleTime: 10 * 60 * 1000,
        retry: 1,
    })

    useEffect(() => {
        const socket = getSocket();
        if (!socket) return;

        socket.emit('join:conversation', conversationId);

        queryClient.setQueryData(['conversations', user?.id], (old) => {
            if (!old) return old;
            return old.map(conv =>
                conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
            );
        });

        socket.on('message:deleted', (messageId) => {
            queryClient.setQueryData(['conversation', conversationId], (old) => {
                if (!old) return old;

                return { ...old, messages: old.messages.filter(m => m.id !== messageId) };
            });
        });

        return () => {
            socket.emit('leave:conversation', conversationId);
            socket.off('message:delete')
        };
    }, [conversationId]);

    // Auto-Scroll nach unten bei neuen Nachrichten
    useEffect(() => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    }, [conversation?.messages]);

    function sendMessage() {
        if (!input.trim()) return;
        const socket = getSocket();

        const tempMessage = {
            id: `temp-${Date.now()}`,
            text: input,
            userId: user.id,
            user: user,
            conversationId,
            createdAt: new Date().toISOString(),
            pending: true,
        };

        // Sofort in den Cache
        queryClient.setQueryData(['conversation', conversationId], (old) => {
            if (!old) return old;
            return {
                ...old,
                messages: [...old.messages, tempMessage]
            };
        });

        socket.emit('message:send', { conversationId, text: input });
        setInput('');
    }

    function shouldGroupMessage(current, previous) {
        if (!previous) return false;
        if (current.userId !== previous.userId) return false;

        const timeDiff = new Date(current.createdAt) - new Date(previous.createdAt);
        const oneHour = 60 * 60 * 1000;

        return timeDiff < oneHour;
    }



    if (isLoading) return <Spinner size="w-10 h-10" />;
    if (isError) return <ErrorMessage message="Chat konnte nicht geladen werden" icon={<FontAwesomeIcon icon={faMessage} />} />;

    const otherUsers = conversation.participants.filter(participant => participant.user.id !== user.id);
    const icons = otherUsers.map(participant => participant.user.username.charAt(0).toUpperCase());
    const avatars = otherUsers.map(participant => participant.user.avatar);
    const isSingle = otherUsers.length === 1;

    const conversationTitle = otherUsers.map(participant => participant.user.username).join(', ');

    const typingUsersString = typingUsers.map(userId => otherUsers.find(user => user.user.id === userId)?.user.username).join(', ');

    return (
        <>
            <ContentHeader>
                <div className="flex items-center text-xl text-foreground gap-3">
                    { isSingle ? (
                        <UserAvatar size="w-6 h-6" avatar={otherUsers[0].user.avatar} displayOnline={false} icon={icons[0]} />
                    ) : (
                        <UserAvatarGroup size="w-5 h-5" avatars={avatars} icons={icons} />
                    )}
                    <span className="font-medium">{conversationTitle}</span>
                </div>
            </ContentHeader>
            <div className="flex h-full w-full overflow-hidden">
                <div className="flex flex-col w-full h-full relative">
                    {conversation.messages.length > 0 ? (
                        <div className="relative flex grow flex-col pt-4 pb-8 overflow-y-auto">
                            { conversation.messages.map((message, index) => {
                                const previous = conversation.messages[index - 1];
                                const isGrouped = shouldGroupMessage(message, previous);

                                return <MessageItem isGrouped={isGrouped} key={message.id} message={message} />
                            })}
                            <div ref={messagesEndRef} />
                        </div>
                    ) : (
                        <NoResultsMessage icon={<FontAwesomeIcon icon={faMessages} />} title="Keine Nachrichten" message="Es ist ziemlich leer hier. Schreibe die erste Nachricht."/>
                    )}

                    <div className="absolute z-2 bottom-[64px] left-0 w-full h-16 bg-gradient-to-b from-transparent to-background pointer-events-none"></div>
                    <div className="relative flex flex-col px-1.5 pb-2 z-3">
                        { typingUsers.length > 0 && (
                            <div className="absolute animate animate-pulse -top-6 rounded-lg text-xs bg-transparent text-foreground w-full px-2 py-1">{typingUsersString} is typing...</div>
                        )}
                        <input type="text" className="w-full p-2 h-[56px] text-foreground placeholder:text-muted-foreground! border border-border outline-none rounded-lg shadow-sm bg-card focus:ring-2 focus:ring-primary/80 transition-colors"
                               placeholder={`Nachricht an ${conversationTitle} schreiben...`}
                               value={input} onChange={(e) => {
                                   setInput(e.target.value)
                                    sendTyping();
                               }}
                               onKeyDown={e => {
                                   if(e.key === 'Enter') {
                                       sendMessage()
                                       stopTyping();
                                   }
                               }} />
                    </div>
                </div>
                { isSingle ? (
                    <div className="max-w-xs w-full bg-card/70 h-full">

                    </div>
                ) : (
                    <div className="max-w-xs flex flex-col px-2 py-4 w-full h-full bg-card/70">
                        <span className="text-sm px-2 text-foreground mb-2">Teilnehmer - {conversation.participants.length}</span>
                        { conversation.participants.map((participant) => (
                            <UserItem user={participant.user} key={participant.user.id} />
                        ))}
                    </div>
                )}

            </div>

        </>
    )
}
export default Conversation;