import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faUsers} from "@awesome.me/kit-95376d5d61/icons/classic/regular";
import {useParams} from "react-router-dom";
import ContentHeader from "../../components/ContentHeader.jsx";
import {useQuery, useQueryClient} from "@tanstack/react-query";
import {fetchConversation} from "../../../services/api.js";
import ErrorMessage from "../../components/static/ErrorMessage.jsx";
import {faMessage} from "@awesome.me/kit-95376d5d61/icons/classic/light";
import Spinner from "../../components/static/Spinner.jsx";
import UserAvatar from "../../components/UserAvatar.jsx";
import UserAvatarGroup from "../../components/UserAvatarGroup.jsx";
import {useEffect, useRef, useState} from "react";
import {getSocket} from "../../../services/socket.js";
import {useAuth} from "../../../hooks/useAuth.js";

function Conversation() {
    const {user} = useAuth();
    const { conversationId } = useParams();
    const [input, setInput] = useState('');
    const queryClient = useQueryClient();
    const messagesEndRef = useRef(null);

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

        socket.on('message:new', (message) => {
            queryClient.setQueryData(['conversation', conversationId], (old) => {
                if (!old) return old;
                return {
                    ...old,
                    messages: [...old.messages, message]
                };
            });
        });

        return () => {
            socket.emit('leave:conversation', conversationId);
            socket.off('message:new');
        };
    }, [conversationId]);

    // Auto-Scroll nach unten bei neuen Nachrichten
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [conversation?.messages]);

    function sendMessage() {
        if (!input.trim()) return;
        const socket = getSocket();
        socket.emit('message:send', { conversationId, text: input });
        setInput('');
    }

    if (isLoading) return <Spinner size="w-10 h-10" />;
    if (isError) return <ErrorMessage message="Chat konnte nicht geladen werden" icon={<FontAwesomeIcon icon={faMessage} />} />;

    const otherUsers = conversation.participants.filter(participant => participant.user.id !== user.id);
    const icons = otherUsers.map(participant => participant.user.username.charAt(0).toUpperCase());
    const isSingle = otherUsers.length === 1;

    const conversationTitle = otherUsers.map(participant => participant.user.username).join(', ');

    return (
        <>
            <ContentHeader>
                <div className="flex items-center text-xl text-foreground gap-3">
                    { isSingle ? (
                        <UserAvatar size="w-6 h-6" icon={icons[0]} />
                    ) : (
                        <UserAvatarGroup size="w-5 h-5" icons={icons} />
                    )}
                    <span className="font-medium">{conversationTitle}</span>
                </div>
            </ContentHeader>
            <div className="flex h-full w-full">
                <div className="flex flex-col w-full h-full overflow-hidden">
                    <div className="flex grow flex-col gap-4 p-4">
                        { conversation.messages.map((message) => (
                            <div key={message.id} className="flex items-center gap-3">
                                <UserAvatar size="w-9 h-9" icon={message.user.username.charAt(0).toUpperCase()} />
                                <div className="flex flex-col">
                                    <span className="text-base text-foreground font-bold">{message.user.username}</span>
                                    <span className="text-base text-foreground">{message.text}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="px-1.5 pb-2">
                        <input type="text" className="w-full p-2 h-[56px] text-foreground placeholder:text-muted-foreground! border border-border outline-none rounded-lg shadow-sm bg-card focus:ring-2 focus:ring-primary/80 transition-colors"
                               placeholder={`Nachricht an ${conversationTitle} schreiben...`}
                               value={input} onChange={(e) => setInput(e.target.value)}
                               onKeyDown={e => e.key === 'Enter' && sendMessage()} />
                    </div>
                </div>
                <div className="max-w-sm w-full bg-card/70 h-full"></div>
            </div>

        </>
    )
}
export default Conversation;