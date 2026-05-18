import UserAvatar from "../../components/UserAvatar.jsx";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faSpinnerThird} from "@awesome.me/kit-95376d5d61/icons/classic/regular";
import {faThumbtack} from "@awesome.me/kit-95376d5d61/icons/classic/solid";
import MessageActionPopup from "./MessageActionPopup.jsx";
import HasUserPopup from "../../components/user/HasUserPopup.jsx";
import Reactions from "./Reactions.jsx";
import {useReplyState} from "../../../hooks/messages/useReplyState.js";
import {useState, useRef, useEffect} from "react";
import {useAuth} from "../../../hooks/useAuth.js";
import {useUserStatus} from "../../../hooks/usePresence.js";
import {editMessage} from "../../../hooks/messages/useEditMessage.js";
import LinkEmbed, {extractFirstUrl} from "./LinkEmbed.jsx";
import {faServer} from "@awesome.me/kit-95376d5d61/icons/classic/light";
import {useNavigate, useParams} from "react-router-dom";
import {joinServer} from "../../../services/api.js";
import {useQueryClient} from "@tanstack/react-query";
import MessageInput from "./MessageInput.jsx";
import MessageAttachments from "./MessageAttachments.jsx";
import PollMessage from "./PollMessage.jsx";
import {getSocket} from "../../../services/socket.js";

const MENTION_REGEX = /@(\w+)/g;
const SPECIAL_MENTION_REGEX = /(?<!\w)@(everyone|here)(?!\w)/g;
const CHANNEL_REGEX = /#([\w-]+)/g;
const LINK_REGEX = /https?:\/\/[^\s<>"[\]{}|\\^`]+/g;

function InviteMessage({invite}) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    async function join(inviteCode) {
        const member = await joinServer(inviteCode);

        if(!member.error) {
            const socket = getSocket();

            queryClient.setQueryData(['servers'], (old) => {
                if (!old) return old;

                return [...old, member.server];
            });

            socket.emit('server:user:update', 'join', member.userId, invite.server.id);

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
                <div className="font-bold text-lg">{invite ? invite?.server.name : 'Unbekannter Server'}</div>
                {invite && (
                    <div className="text-xs text-muted-foreground mb-4">{`Gegründet am ${new Date(invite.server.createdAt).toLocaleDateString('de-DE', {day: '2-digit', month: '2-digit', year: 'numeric'})}`}</div>
                )}
                <button onClick={async () => await join(invite?.code)}
                    className="cursor-pointer bg-primary text-sm text-primary-foreground hover:bg-primary/90 px-2 py-1 rounded-md">Beitreten</button>
            </div>
        </div>
    )
}

function MessageItem({message, color = '', isGrouped = false, disabled = false}) {
    const { user: messageUser } = message;
    const { user } = useAuth();
    const liveStatus = useUserStatus(user?.id);
    const myStatus = liveStatus ?? user?.status;
    const { serverId } = useParams();
    const [hovered, setHovered] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState('');
    const textareaRef = useRef(null);
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { replyTo } = useReplyState(message.conversationId || message.channelId);
    const roomType = message.conversationId ? 'conversation' : 'channel';

    useEffect(() => {
        if (isEditing && textareaRef.current) {
            const el = textareaRef.current;
            el.focus();
            el.setSelectionRange(el.value.length, el.value.length);
        }
    }, [isEditing]);

    function startEditing() {
        setEditText(message.text);
        setIsEditing(true);
    }

    function submitEdit() {
        const trimmed = editText.trim();
        if (trimmed && trimmed !== message.text) {
            editMessage(roomType, message.id, trimmed);
        }
        setIsEditing(false);
    }

    function handleEditKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submitEdit();
        }
        if (e.key === 'Escape') {
            setIsEditing(false);
        }
    }

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
        const segments = [];

        for (const match of text.matchAll(LINK_REGEX)) {
            segments.push({ start: match.index, end: match.index + match[0].length, type: 'link', content: match[0], href: match[0] });
        }

        for (const match of text.matchAll(SPECIAL_MENTION_REGEX)) {
            const overlaps = segments.some(s => match.index < s.end && match.index + match[0].length > s.start);
            if (!overlaps) {
                segments.push({ start: match.index, end: match.index + match[0].length, type: 'special-mention', content: match[0], kind: match[1] });
            }
        }

        for (const match of text.matchAll(MENTION_REGEX)) {
            const overlaps = segments.some(s => match.index < s.end && match.index + match[0].length > s.start);
            const mention = (mentions || []).find(m => m.user.username === match[1]);
            if (!overlaps && mention) {
                segments.push({ start: match.index, end: match.index + match[0].length, type: 'mention', content: match[0], mentionUser: mention.user });
            }
        }

        for (const match of text.matchAll(CHANNEL_REGEX)) {
            const overlaps = segments.some(s => match.index < s.end && match.index + match[0].length > s.start);
            if (!overlaps) {
                segments.push({ start: match.index, end: match.index + match[0].length, type: 'channel', content: match[0], channelName: match[1] });
            }
        }

        if (segments.length === 0) return [{ type: 'text', content: text }];

        segments.sort((a, b) => a.start - b.start);

        const parts = [];
        let lastIndex = 0;
        for (const seg of segments) {
            if (seg.start > lastIndex) parts.push({ type: 'text', content: text.slice(lastIndex, seg.start) });
            parts.push(seg);
            lastIndex = seg.end;
        }
        if (lastIndex < text.length) parts.push({ type: 'text', content: text.slice(lastIndex) });

        return parts;
    }

    function navigateToChannel(channelName) {
        if (!serverId) return;
        const channels = queryClient.getQueryData(['channels', serverId]) || [];
        const ch = channels.find(c => c.name === channelName);
        if (ch) navigate(`/servers/${serverId}/channels/${ch.id}`);
    }

    const amIMentioned = (message && message.mentions.some(mention => mention.user.id === user.id))
        || (message.replyTo && message.replyTo.user.id === user.id && message.userId !== user.id)
        || message.mentionEveryone
        || (message.mentionHere && myStatus !== 'invisible');
    const embedUrl = !message.pending && message.type !== 'server_invite' ? extractFirstUrl(message.text) : null;

    return disabled || !isGrouped || message.replyTo || message.pinned ? (
        <div onMouseMove={() => !hovered && setHovered(true)}
             onMouseLeave={() => setHovered(false)}
            id={`message-${message.id}`} className={`${disabled ? 'pointer-events-none' : ''} ${amIMentioned ? 'bg-idle/5! border-idle! hover:bg-idle/10!' : ''} ${replyTo && replyTo.id === message.id ? 'bg-primary/10 border-primary hover:bg-primary/15' : 'hover:bg-muted/50 border-transparent'} relative border-l-2 flex flex-col mt-4 transition-colors duration-300  group`}>
            {message.pinned && (
                <div className="flex items-center gap-1.5 px-4 pt-1 text-xs text-muted-foreground">
                    <FontAwesomeIcon icon={faThumbtack} className="text-[10px]" />
                    <span>Angepinnt</span>
                </div>
            )}
            {message.replyTo && (
                <div onClick={() => scrollToMessage(message.replyTo.id)} className="flex items-center bg-primary/3  py-1 pl-4 relative hover:bg-primary/10 cursor-pointer">
                    <div className="absolute top-1/2 left-8 w-6 h-3 border-l-2 border-t-2 border-primary/80 rounded-tl-md"></div>
                    <span className="text-sm flex items-center text-primary/80 pl-13 overflow-hidden">
                        <span className="mr-1 shrink-0">Antwort an</span>
                        <HasUserPopup user={message.replyTo.user}>
                            <div className="flex items-center hover:underline">
                                <UserAvatar size="w-3.5 h-3.5 text-xs" displayOnline={false} avatar={message.replyTo.user.avatar} icon={message.replyTo.user.username.charAt(0).toUpperCase()} />
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
                <div className="flex flex-col w-full">
                    <div className="flex items-start gap-2">
                        <HasUserPopup user={messageUser} >
                            <span className="text-lg mt-0.5 font-bold text-foreground hover:underline">{messageUser.displayName ?? messageUser.username}</span>
                        </HasUserPopup>
                        <span className="text-sm mt-1 text-muted-foreground">{dateTimeString}</span>
                    </div>
                    {isEditing ? (
                        <div className="flex flex-col gap-1.5 w-full mt-0.5 pr-4">
                            <textarea
                                ref={textareaRef}
                                value={editText}
                                onChange={e => setEditText(e.target.value)}
                                onKeyDown={handleEditKeyDown}
                                className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring resize-none w-full min-w-64"
                                rows={Math.max(1, editText.split('\n').length)}
                            />
                            <span className="text-xs text-muted-foreground">
                                <kbd className="bg-muted/80 px-1.5 py-0.5 rounded text-xs font-mono">Esc</kbd> Abbrechen
                                {' · '}
                                <kbd className="bg-muted/80 px-1.5 py-0.5 rounded text-xs font-mono">Enter</kbd> Speichern
                            </span>
                        </div>
                    ) : (
                        <div className={`${message.pending ? 'text-muted-foreground' : 'text-foreground'} flex flex-col gap-1 whitespace-pre-wrap text-base`}>
                            {message.edited && <span className="text-[10px] leading-1 pt-1 text-muted-foreground">(bearbeitet)</span>}
                            {message.text && (
                                <div className="flex">
                                    {parseMessageText(message.text, message.mentions).map((part, index) =>
                                        part.type === 'mention' ? (
                                            <HasUserPopup classes={"w-max"} key={index} user={part.mentionUser}>
                                                <span className="text-primary hover:underline cursor-pointer">{part.content}</span>
                                            </HasUserPopup>
                                        ) : part.type === 'special-mention' ? (
                                            <span key={index} className="bg-idle/15 text-idle rounded px-1 font-medium">{part.content}</span>
                                        ) : part.type === 'channel' ? (
                                            <span key={index} onClick={() => navigateToChannel(part.channelName)} className="w-max text-primary font-medium cursor-pointer hover:underline">
                                                {part.content}
                                            </span>
                                        ) : part.type === 'link' ? (
                                            <a key={index} href={part.href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">{part.content}</a>
                                        ) : (
                                            <span key={index}>{part.content}</span>
                                        )
                                    )}
                                </div>
                            )}
                            {message.type === 'server_invite' && <InviteMessage invite={message.invite} />}
                            {message.type === 'poll' && message.poll && <PollMessage message={message} />}
                        </div>
                    )}
                    {message.attachments?.length > 0 && !isEditing && <MessageAttachments attachments={message.attachments} />}
                    {embedUrl && !isEditing && <LinkEmbed url={embedUrl} />}
                    <Reactions disabled={disabled} message={message} />
                </div>
                {!disabled && hovered && !isEditing && (
                    <MessageActionPopup message={message} onEdit={startEditing} />
                )}
            </div>
        </div>
    ) : (
        <div onMouseMove={() => !hovered && setHovered(true)}
             onMouseLeave={() => setHovered(false)}
            id={`message-${message.id}`} className={`${disabled ? 'pointer-events-none' : ''} ${amIMentioned ? 'bg-idle/5! border-idle! hover:bg-idle/10!' : ''} ${replyTo && replyTo.id === message.id ? 'bg-primary/10 border-primary hover:bg-primary/15' : 'hover:bg-muted/50 border-transparent'} border-l-2 relative flex items-start pl-6 pr-4 transition-colors duration-700 py-0.5 group`}>
            <span className="w-11 text-[10px] text-foreground/70 shrink-0 opacity-0 group-hover:opacity-100 relative top-1">{timeString}</span>
            <div className="flex flex-col w-full">
                {isEditing ? (
                    <div className="flex flex-col gap-1.5 mt-0.5 pr-4">
                        <textarea
                            ref={textareaRef}
                            value={editText}
                            onChange={e => setEditText(e.target.value)}
                            onKeyDown={handleEditKeyDown}
                            className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring resize-none w-full min-w-64"
                            rows={Math.max(1, editText.split('\n').length)}
                        />
                        <span className="text-xs text-muted-foreground">
                            <kbd className="bg-muted/80 px-1.5 py-0.5 rounded text-xs font-mono">Esc</kbd> Abbrechen
                            {' · '}
                            <kbd className="bg-muted/80 px-1.5 py-0.5 rounded text-xs font-mono">Enter</kbd> Speichern
                        </span>
                    </div>
                ) : (
                    <div className={`${message.pending ? 'text-muted-foreground' : 'text-foreground'} flex flex-col gap-1 whitespace-pre-wrap text-base`}>
                        {message.edited && <span className="text-[10px] leading-1 pt-1 text-muted-foreground">(bearbeitet)</span>}
                        {message.text && (
                            <div className="flex">
                                {parseMessageText(message.text, message.mentions).map((part, index) =>
                                    part.type === 'mention' ? (
                                        <HasUserPopup classes={"w-max"} key={index} user={part.mentionUser}>
                                            <span className="text-primary hover:underline cursor-pointer">{part.content}</span>
                                        </HasUserPopup>
                                    ) : part.type === 'special-mention' ? (
                                        <span key={index} className="bg-idle/15 text-idle rounded px-1 font-medium">{part.content}</span>
                                    ) : part.type === 'channel' ? (
                                        <span key={index} onClick={() => navigateToChannel(part.channelName)} className="w-max text-primary font-medium cursor-pointer hover:underline">
                                        {part.content}
                                    </span>
                                    ) : part.type === 'link' ? (
                                        <a key={index} href={part.href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">{part.content}</a>
                                    ) : (
                                        <span key={index}>{part.content}</span>
                                    )
                                )}
                            </div>
                        )}
                        {message.type === 'server_invite' && <InviteMessage invite={message.invite} />}
                        {message.type === 'poll' && message.poll && <PollMessage message={message} />}
                    </div>
                )}
                {message.attachments?.length > 0 && !isEditing && <MessageAttachments attachments={message.attachments} />}
                {embedUrl && !isEditing && <LinkEmbed url={embedUrl} />}
                <Reactions disabled={disabled} message={message} />
            </div>
            {!disabled && hovered && !isEditing && (
                <MessageActionPopup message={message} onEdit={startEditing} />
            )}
        </div>
    );
}
export default MessageItem;