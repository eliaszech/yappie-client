import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {useParams} from "react-router-dom";
import ContentHeader from "../../components/ContentHeader.jsx";
import {useQuery, useQueryClient} from "@tanstack/react-query";
import {fetchConversation} from "../../../services/api.js";
import ErrorMessage from "../../components/static/ErrorMessage.jsx";
import {faMessage, faMessages, faUsers} from "@awesome.me/kit-95376d5d61/icons/classic/light";
import Spinner from "../../components/static/Spinner.jsx";
import UserAvatar from "../../components/UserAvatar.jsx";
import UserAvatarGroup from "../../components/UserAvatarGroup.jsx";
import {useEffect, useRef} from "react";
import {getSocket} from "../../../services/socket.js";
import {useAuth} from "../../../hooks/useAuth.js";
import UserItem from "../../components/UserItem.jsx";
import MessageInput from "../../messages/components/MessageInput.jsx";
import Chat from "../../messages/components/Chat.jsx";
import HasUserPopup from "../../components/user/HasUserPopup.jsx";
import Dropdown from "../../components/Dropdown.jsx";
import StatusText from "../../components/user/StatusText.jsx";
import StatusPicker from "../../components/user/StatusPicker.jsx";
import {useIsOnline, useUserStatus} from "../../../hooks/usePresence.js";

function UserSidebar({user}) {
    const online = useIsOnline(user.id) || user.online;
    const status = useUserStatus(user.id) || user.status;

    return (
        <div className="max-w-xs border-l border-border w-full bg-card/70 h-full">
            <div className="h-16 bg-primary rounded-b-lg" />
            {/* Avatar */}
            <div className="px-4 -mt-8">
                <UserAvatar size="w-16 h-16 text-2xl border-4 border-card"
                    onlineSize="w-5 h-5 bottom-0 right-0" icon={user.username.charAt(0).toUpperCase()}
                    online={online} status={status}
                />
            </div>
            {/* User Info */}
            <div className="p-4">
                <div className="text-xl font-bold text-foreground">{user.displayName ?? user.username}</div>
                <div className="text-sm text-muted-foreground">{user.username}</div>

                <div className="mt-2">
                    <span className="text-xs font-semibold text-foreground">Mitglied seit</span>
                    <p className="text-xs text-muted-foreground mt-1">
                        {new Date(user.createdAt).toLocaleDateString('de-DE', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                        })}
                    </p>
                </div>
            </div>
        </div>
    )
}

function Conversation() {
    const {user} = useAuth();
    const { conversationId } = useParams();
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

    if (isLoading) return <Spinner size="w-10 h-10" />;
    if (isError) return <ErrorMessage message="Chat konnte nicht geladen werden" icon={<FontAwesomeIcon icon={faMessage} />} />;

    const otherUsers = conversation.participants.filter(participant => participant.user.id !== user.id);
    const icons = otherUsers.map(participant => participant.user.username.charAt(0).toUpperCase());
    const avatars = otherUsers.map(participant => participant.user.avatar);
    const isSingle = otherUsers.length === 1;
    const conversationTitle = otherUsers.map(participant => participant.user.displayName ?? participant.user.username).join(', ');

    return (
        <>
            <ContentHeader>
                <div className="flex items-center text-foreground gap-3">
                    { isSingle ? (
                        <UserAvatar size="w-6 h-6" avatar={otherUsers[0].user.avatar} displayOnline={false} icon={icons[0]} />
                    ) : (
                        <UserAvatarGroup size="w-6 h-6" avatars={avatars} icons={icons} />
                    )}
                    <span className="font-medium">{conversationTitle}</span>
                </div>
            </ContentHeader>
            <div className="flex h-full w-full overflow-hidden">
                <div className="flex flex-col w-full h-full relative">
                    <Chat type="conversation" roomId={conversationId} >
                        <div className="flex flex-col px-8 text-foreground gap-2.5 pb-8">
                            <div className="mb-2">
                                {isSingle ? <UserAvatar displayOnline={false} size="w-[100px] h-[100px] text-5xl" icon={icons[0]}/> : <UserAvatar size="w-[100px] h-[100px]" displayOnline={false} icon={<FontAwesomeIcon className="text-5xl" icon={faUsers} />} />}
                            </div>
                            <div className="text-4xl font-bold">{conversationTitle}</div>
                            <div className="text-xl">
                                { isSingle ? `Die ist der Anfang des Direktnachrichtenchannels mit ${conversationTitle}` : `Willkomen am Anfang der ${conversationTitle}-Gruppe` }
                            </div>
                        </div>
                    </Chat>
                    <div className="absolute z-2 bottom-[64px] left-0 w-full h-16 bg-gradient-to-b from-transparent to-background pointer-events-none"></div>
                    <MessageInput type="conversation" roomId={conversationId} roomName={conversationTitle} />
                </div>
                { isSingle && <UserSidebar user={otherUsers[0].user} />}
                { !isSingle && (
                    <div className="max-w-xs flex flex-col border-l border-border px-2 py-4 w-full h-full bg-card/70">
                        <span className="text-sm px-2 text-foreground mb-2">Teilnehmer - {conversation.participants.length}</span>
                        { conversation.participants.map((participant) => (
                            <HasUserPopup user={participant.user} orientation="left" key={participant.user.id}>
                                <UserItem user={participant.user} />
                            </HasUserPopup>
                        ))}
                    </div>
                )}
            </div>

        </>
    )
}
export default Conversation;