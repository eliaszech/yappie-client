import UserAvatar from "../../components/UserAvatar.jsx";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faSpinnerThird} from "@awesome.me/kit-95376d5d61/icons/classic/regular";
import MessageActionPopup from "./MessageActionPopup.jsx";
import HasUserPopup from "../../components/user/HasUserPopup.jsx";
import Reactions from "./Reactions.jsx";
import {useReplyState} from "../../../hooks/messages/useReplyState.js";
import {useState} from "react";
import {useAuth} from "../../../hooks/useAuth.js";
import {faServer} from "@awesome.me/kit-95376d5d61/icons/classic/light";
import {useNavigate} from "react-router-dom";
import {joinServer} from "../../../services/api.js";
import {useQueryClient} from "@tanstack/react-query";

const PARSE_MENTIONS_REGEX = /@(\w+)/g;

function InviteMessage({invite}) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    async function join(inviteCode) {
        const member = await joinServer(inviteCode);

        if(!member.error) {
            queryClient.setQueryData(['servers'], (old) => {
                if (!old) return old;

                return [...old, member.server];
            })

            navigate(`/servers/${invite.server.id}`);
        } else {
            alert(member.error);
        }
    }

    return (
        <div className="rounded-lg bg-card w-[250px]">
            <div className="h-12 bg-primary rounded-t-lg" />

            {/* Avatar */}
            <div className="px-4 -mt-8">
                <UserAvatar size="w-14 h-14 text-2xl border-4 border-card"
                    displayOnline={false} icon={<FontAwesomeIcon icon={faServer} />}
                />
            </div>

            <div className="px-4 flex flex-col pt-2 pb-4">
                <div className="font-bold text-lg">{invite?.server.name}</div>
                <div className="text-xs text-muted-foreground mb-4">{`Gegründet am ${new Date(invite.server.createdAt).toLocaleDateString('de-DE', {day: '2-digit', month: '2-digit', year: 'numeric'})}`}</div>
                <button onClick={async () => await join(invite.code)}
                    className="cursor-pointer bg-primary text-sm text-primary-foreground hover:bg-primary/90 px-2 py-1 rounded-md">Beitreten</button>
            </div>
        </div>
    )
}

function MessageItem({message, isGrouped = false, disabled = false}) {
    const { user: messageUser } = message;
    const { user } = useAuth();
    const [hovered, setHovered] = useState(false);
    const { replyTo } = useReplyState(message.conversationId || message.channelId);

    const dateTimeString = new Date(message.createdAt).toLocaleString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })

    const timeString = dateTimeString.split(',')[1].trim();

    function scrollToMessage(messageId) {
        const element = document.getElementById(`message-${messageId}`);
        if (!element) return;

        element.scrollIntoView({ behavior: 'smooth', block: 'center' });

        element.classList.add('bg-primary/10!');
        setTimeout(() => {
            element.classList.remove('bg-primary/10!');
        }, 1500);
    }

    function parseMessageText(text, mentions) {
        if (!mentions || mentions.length === 0) return [{ type: 'text', content: text }];

        const parts = [];
        let lastIndex = 0;

        for (const match of text.matchAll(PARSE_MENTIONS_REGEX)) {
            const matchedUsername = match[1];
            const mention = mentions.find(m => m.user.username === matchedUsername);

            if (!mention) continue;

            // Text vor der Mention
            if (match.index > lastIndex) {
                parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
            }

            parts.push({ type: 'mention', content: `@${matchedUsername}`, mentionUser: mention.user });
            lastIndex = match.index + match[0].length;
        }

        // Rest nach letzter Mention
        if (lastIndex < text.length) {
            parts.push({ type: 'text', content: text.slice(lastIndex) });
        }

        return parts;
    }

    const amIMentioned = (message && message.mentions.some(mention => mention.user.id === user.id)) || (message.replyTo && message.replyTo.user.id === user.id && message.userId !== user.id);

    return disabled || !isGrouped || message.replyTo ? (
        <div onMouseMove={() => !hovered && setHovered(true)}
             onMouseLeave={() => setHovered(false)}
            id={`message-${message.id}`} className={`${disabled ? 'pointer-events-none' : ''} ${amIMentioned ? 'bg-idle/5! border-idle! hover:bg-idle/10!' : ''} ${replyTo && replyTo.id === message.id ? 'bg-primary/10 border-primary hover:bg-primary/15' : 'hover:bg-muted/50 border-transparent'} relative border-l-2 flex flex-col mt-4 transition-colors duration-300  group`}>
            {message.replyTo && (
                <div onClick={() => scrollToMessage(message.replyTo.id)} className="flex items-center bg-primary/3  py-1 pl-4 relative hover:bg-primary/10 cursor-pointer">
                    <div className="absolute top-1/2 left-8 w-6 h-3 border-l-2 border-t-2 border-primary/80 rounded-tl-md"></div>
                    <span className="text-sm flex items-center text-primary/80 pl-13 overflow-hidden">
                        <span className="mr-1 shrink-0">Antwort an</span>
                        <HasUserPopup user={message.replyTo.user}>
                            <div className="flex items-center hover:underline">
                                <UserAvatar size="w-3.5 h-3.5 text-xs" displayOnline={false} icon={message.replyTo.user.username.charAt(0).toUpperCase()} />
                                <span className="ml-1 mr-1">{message.replyTo.user.displayName ?? message.replyTo.user.username}: </span>
                            </div>
                        </HasUserPopup>
                        <div className="truncate">{message.replyTo.text.slice(0, 100)}</div>
                    </span>
                </div>
            )}
            <div className={`flex items-start gap-3 px-4 py-0.5`}>
                <HasUserPopup user={messageUser}>
                    <UserAvatar size="w-10 h-10 relative top-2" displayOnline={false} avatar={messageUser.avatar} icon={messageUser.username.charAt(0).toUpperCase()} />
                </HasUserPopup>
                <div className="flex flex-col">
                    <div className="flex items-start gap-2">
                        <HasUserPopup user={messageUser} >
                            <span className="text-lg mt-0.5 font-bold text-foreground hover:underline">{messageUser.displayName ?? messageUser.username}</span>
                        </HasUserPopup>
                        <span className="text-sm mt-1 text-muted-foreground">{dateTimeString}</span>
                    </div>
                    <div className={`${message.pending ? 'text-muted-foreground' : 'text-foreground'} flex flex-col gap-1 whitespace-pre-wrap text-base`}>
                        {parseMessageText(message.text, message.mentions).map((part, index) =>
                            part.type === 'mention' ? (
                                <HasUserPopup key={index} user={part.mentionUser}>
                                    <span className="text-primary hover:underline cursor-pointer">{part.content}</span>
                                </HasUserPopup>
                            ) : (
                                <span key={index}>{part.content}</span>
                            )
                        )}
                        {message.type === 'server_invite' && <InviteMessage invite={message.invite} />}
                    </div>
                    <Reactions disabled={disabled} message={message} />
                </div>
                {!disabled && hovered && (
                    <MessageActionPopup message={message} />
                )}
            </div>
        </div>
    ) : (
        <div onMouseMove={() => !hovered && setHovered(true)}
             onMouseLeave={() => setHovered(false)}
            id={`message-${message.id}`} className={`${disabled ? 'pointer-events-none' : ''} ${amIMentioned ? 'bg-idle/5! border-idle! hover:bg-idle/10!' : ''} ${replyTo && replyTo.id === message.id ? 'bg-primary/10 border-primary hover:bg-primary/15' : 'hover:bg-muted/50 border-transparent'} border-l-2 relative flex items-start pl-6 pr-4 transition-colors duration-700 py-0.5 group`}>
            <span className="w-11 text-[10px] text-foreground/70 shrink-0 opacity-0 group-hover:opacity-100 relative top-1">{timeString}</span>
            <div className="flex flex-col">
                <div className={`${message.pending ? 'text-muted-foreground' : 'text-foreground'} flex flex-col gap-1 whitespace-pre-wrap text-base`}>
                    {parseMessageText(message.text, message.mentions).map((part, index) =>
                        part.type === 'mention' ? (
                            <HasUserPopup key={index} user={part.mentionUser}>
                                <span className="text-primary hover:underline cursor-pointer">{part.content}</span>
                            </HasUserPopup>
                        ) : (
                            <span key={index}>{part.content}</span>
                        )
                    )}
                    {message.type === 'server_invite' && <InviteMessage invite={message.invite} />}
                </div>
                <Reactions disabled={disabled} message={message} />
            </div>
            {!disabled && hovered && (
                <MessageActionPopup message={message} />
            )}
        </div>
    );
}
export default MessageItem;