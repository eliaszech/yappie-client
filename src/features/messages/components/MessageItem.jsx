import UserAvatar from "../../components/UserAvatar.jsx";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faThumbtack, faTrash, faPen, faFaceSmile, faArrowTurnLeft, faThumbtackSlash, faFaceSmilePlus, faPhone, faPhoneSlash, faUserPlus} from "@awesome.me/kit-95376d5d61/icons/classic/solid";
import {faCopy, faEnvelope, faSmile} from "@awesome.me/kit-95376d5d61/icons/classic/regular";
import MessageActionPopup from "./MessageActionPopup.jsx";
import HasUserPopup from "../../components/user/HasUserPopup.jsx";
import HasEmojiPicker from "./HasEmojiPicker.jsx";
import Reactions from "./Reactions.jsx";
import ReactionViewerModal from "../dialogs/ReactionViewerModal.jsx";
import ConfirmDeleteMessageDialog from "../dialogs/ConfirmDeleteMessageDialog.jsx";
import {useReplyState} from "../../../hooks/messages/useReplyState.js";
import {useState, useRef, useEffect} from "react";
import {useAuth} from "../../../hooks/useAuth.js";
import {useUserStatus} from "../../../hooks/usePresence.js";
import {editMessage} from "../../../hooks/messages/useEditMessage.js";
import {deleteMessage} from "../../../hooks/messages/useDeleteMessage.js";
import {toggleReaction} from "../../../hooks/messages/useReactMessage.js";
import LinkEmbed, {extractFirstUrl, isPureMediaUrl} from "./LinkEmbed.jsx";
import {useNavigate, useParams} from "react-router-dom";
import {useQuery, useQueryClient} from "@tanstack/react-query";
import MessageAttachments from "./MessageAttachments.jsx";
import PollMessage from "./PollMessage.jsx";
import InviteCard from "./InviteCard.jsx";
import {useMemberTopRoleColor} from "../../../hooks/useMemberTopRoleColor.js";
import {useContextMenu} from "../../../hooks/useContextMenu.js";
import {fetchServer, fetchChannels, pinMessage, unpinMessage, pinConversationMessage, unpinConversationMessage} from "../../../services/api.js";
import {hasPermission, hasChannelPermission, PERMISSIONS} from "../../../services/permissions.js";
import {markChannelAsUnread, markConversationAsUnread} from "../../../hooks/useReadStates.js";

const MENTION_REGEX = /@(\w+)/g;
const SPECIAL_MENTION_REGEX = /(?<!\w)@(everyone|here)(?!\w)/g;
const CHANNEL_REGEX = /#([\w-]+)/g;
const LINK_REGEX = /https?:\/\/[^\s<>"[\]{}|\\^`]+/g;
const INVITE_REGEX = /(?:https?:\/\/)?(?:www\.)?yappie\.ch\/invite\/([A-Za-z0-9]+)/g;

function parseInviteCode(href) {
    const m = href.match(/yappie\.ch\/invite\/([A-Za-z0-9]+)/);
    return m ? m[1] : null;
}

function getMessageInviteCode(message) {
    if (message?.invite?.code) return message.invite.code;
    if (!message?.text) return null;
    const m = message.text.match(/yappie\.ch\/invite\/([A-Za-z0-9]+)/);
    return m ? m[1] : null;
}

// Mention tag with role-coloured tint. Falls back to the default primary blue
// when no server context (DMs) or the mentioned user has no coloured role.
function MentionTag({ mentionUser, serverId, content, classes = '' }) {
    const color = useMemberTopRoleColor(serverId, mentionUser?.id);
    return (
        <HasUserPopup classes={classes} user={mentionUser} serverId={serverId}>
            <span
                className={`${color ? '' : 'text-primary'} hover:underline cursor-pointer rounded px-1 font-medium`}
                style={color ? { color, backgroundColor: `${color}26` } : undefined}
            >
                {content}
            </span>
        </HasUserPopup>
    );
}


function MessageItem({message, color = '', isGrouped = false, disabled = false}) {
    const { user: messageUser } = message;
    const { user } = useAuth();
    const liveStatus = useUserStatus(user?.id);
    const myStatus = liveStatus ?? user?.status;
    const { serverId } = useParams();
    const authorRoleColor = useMemberTopRoleColor(serverId, messageUser?.id);
    const [hovered, setHovered] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState('');
    const [viewingReactions, setViewingReactions] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const textareaRef = useRef(null);
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { replyTo, setReplyState } = useReplyState(message.conversationId || message.channelId);
    const roomType = message.conversationId ? 'conversation' : 'channel';
    const { openContextMenu } = useContextMenu();

    const { data: server } = useQuery({
        queryKey: ['server', serverId],
        queryFn: () => fetchServer(serverId),
        enabled: roomType === 'channel' && !!serverId,
        staleTime: 10 * 60 * 1000,
    });
    // Channel object (with effective permissions mask) for channel-level
    // permission checks. Falls back to server-level via hasChannelPermission.
    const { data: serverChannels = [] } = useQuery({
        queryKey: ['channels', serverId],
        queryFn: () => fetchChannels(serverId),
        enabled: roomType === 'channel' && !!serverId,
        staleTime: 10 * 60 * 1000,
    });
    const channelObj = roomType === 'channel'
        ? serverChannels.find(c => c.id === message.channelId)
        : null;

    const isOwnMessage = message.user.id === user.id;
    // DMs: every participant can pin. Channels: gated by PIN_MESSAGES (channel-level).
    const canPin = roomType === 'conversation' || hasChannelPermission(channelObj, server, PERMISSIONS.PIN_MESSAGES);
    const canDelete = isOwnMessage
        || (roomType === 'channel' && hasChannelPermission(channelObj, server, PERMISSIONS.MANAGE_MESSAGES))
        || roomType === 'conversation';
    // Reactions in DMs are always allowed; in channels gated per-channel.
    const canReact = roomType === 'conversation' || hasChannelPermission(channelObj, server, PERMISSIONS.ADD_REACTIONS);
    const hasReactions = (message.reactions || []).length > 0;
    const hasText = !!message.text && message.text.trim().length > 0;

    async function togglePinMessage() {
        const roomId = message.channelId ?? message.conversationId;
        const willPin = !message.pinned;
        queryClient.setQueryData(['messages', roomId], (old) => {
            if (!old) return old;
            return {
                ...old,
                messages: old.messages.map(m => m.id === message.id ? { ...m, pinned: willPin } : m),
            };
        });
        if (roomType === 'conversation') {
            if (willPin) await pinConversationMessage(message.conversationId, message.id);
            else await unpinConversationMessage(message.conversationId, message.id);
        } else {
            if (willPin) await pinMessage(message.channelId, message.id);
            else await unpinMessage(message.channelId, message.id);
        }
    }

    async function copyText() {
        try { await navigator.clipboard.writeText(message.text ?? ''); } catch {}
    }

    async function markAsUnread() {
        if (roomType === 'channel') {
            await markChannelAsUnread(queryClient, message.channelId, message.id);
        } else {
            await markConversationAsUnread(queryClient, message.conversationId, message.id, user.id);
        }
    }

    function handleContextMenu(e) {
        if (disabled || isEditing) return;
        const QUICK_REACTIONS = ['👍', '🔥', '😂', '❤️'];
        const items = [];

        // Reaction quick-row only when allowed (channel-level ADD_REACTIONS).
        if (canReact) {
            items.push({
                render: (close) => (
                    <div className="flex items-center gap-1">
                        {QUICK_REACTIONS.map(emoji => (
                            <button
                                key={emoji}
                                onClick={() => { toggleReaction(message.id, emoji); close(); }}
                                className="cursor-pointer text-lg w-8 h-8 flex items-center justify-center rounded-md hover:bg-muted/60"
                            >
                                {emoji}
                            </button>
                        ))}
                        <HasEmojiPicker
                            onSelect={(emoji) => { toggleReaction(message.id, emoji); close(); }}
                            position="bottom"
                            orientation="left"
                        >
                            <button className="cursor-pointer text-muted-foreground w-8 h-8 flex items-center justify-center rounded-md hover:bg-muted/60">
                                <FontAwesomeIcon icon={faFaceSmilePlus} />
                            </button>
                        </HasEmojiPicker>
                    </div>
                ),
            });
            items.push({ separator: true });
        }
        items.push({
            label: 'Antworten',
            icon: faArrowTurnLeft,
            onClick: () => setReplyState(message),
        });

        if (isOwnMessage && hasText) {
            items.push({ label: 'Bearbeiten', icon: faPen, onClick: () => startEditing() });
        }

        const middle = [];
        if (hasReactions) {
            middle.push({ label: 'Reaktionen ansehen', icon: faSmile, onClick: () => setViewingReactions(true) });
        }
        if (hasText) {
            middle.push({ label: 'Text kopieren', icon: faCopy, onClick: copyText });
        }
        middle.push({ label: 'Als ungelesen markieren', icon: faEnvelope, onClick: markAsUnread });

        if (middle.length > 0) {
            items.push({ separator: true });
            items.push(...middle);
        }

        if (canPin) {
            items.push({ separator: true });
            items.push({
                label: message.pinned ? 'Anpinnen entfernen' : 'Anpinnen',
                icon: message.pinned ? faThumbtackSlash : faThumbtack,
                onClick: togglePinMessage,
            });
        }

        if (canDelete) {
            items.push({ separator: true });
            items.push({
                label: 'Nachricht löschen',
                icon: faTrash,
                danger: true,
                onClick: () => setShowDeleteConfirm(true),
            });
        }

        openContextMenu(e, items);
    }

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

    // Welcome / system event when a user joins the server. Centered, like
    // the call cards. Rendered before any mention/replyTo logic since
    // system rows don't carry that data.
    if (message.type === 'user_joined') {
        const joinedName = message.user?.displayName ?? message.user?.username ?? 'Jemand';
        return (
            <div id={`message-${message.id}`} className="flex justify-center px-4 py-2">
                <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-border bg-card shadow-sm max-w-md">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-green-500/15 text-green-400">
                        <FontAwesomeIcon icon={faUserPlus} className="text-sm" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold text-foreground">
                            <span className="text-foreground">{joinedName}</span>
                            <span className="text-muted-foreground font-normal"> ist dem Server beigetreten</span>
                        </span>
                        <span className="text-[11px] text-muted-foreground">{timeString}</span>
                    </div>
                </div>
            </div>
        );
    }

    // Call system messages render as a centered card — no avatar, no hover
    // toolbar, no action popup. They are still real DB messages so they
    // appear in scrollback like a chat-log entry. Render BEFORE touching
    // mentions/replyTo/etc., which are typically absent on system rows.
    if (message.type === 'call_missed' || message.type === 'call_ended') {
        const isMissed = message.type === 'call_missed';
        // Text format from the backend: "Anruf beendet · 1:23" / "Anruf verpasst".
        // Pull the duration suffix out for the dedicated metadata line so the
        // main label stays clean.
        const duration = !isMissed ? (message.text.split('·')[1]?.trim() ?? null) : null;
        const callerName = message.user?.displayName ?? message.user?.username;
        return (
            <div id={`message-${message.id}`} className="flex justify-center px-4 py-2">
                <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border shadow-sm max-w-md ${
                    isMissed
                        ? 'bg-dnd/10 border-dnd/40'
                        : 'bg-card border-border'
                }`}>
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                        isMissed ? 'bg-dnd/25 text-dnd' : 'bg-primary/20 text-primary'
                    }`}>
                        <FontAwesomeIcon icon={isMissed ? faPhoneSlash : faPhone} className="text-sm" />
                    </div>
                    <div className="flex flex-col">
                        <span className={`text-sm font-semibold ${isMissed ? 'text-dnd' : 'text-foreground'}`}>
                            {isMissed ? 'Anruf verpasst' : 'Anruf beendet'}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                            {duration && <>Dauer {duration} · </>}
                            {isMissed && callerName && <>von {callerName} · </>}
                            {timeString}
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    const amIMentioned = (message && message.mentions.some(mention => mention.user.id === user.id))
        || (message.replyTo && message.replyTo.user.id === user.id && message.userId !== user.id)
        || message.mentionEveryone
        || (message.mentionHere && myStatus !== 'invisible');
    const inviteCode = getMessageInviteCode(message);
    const embedUrl = !message.pending && !inviteCode ? extractFirstUrl(message.text) : null;
    // If the entire message body is just a media URL (image/gif/video/youtube),
    // skip rendering the raw text — the embed alone communicates everything,
    // showing the URL on top is just visual clutter (also matches Discord).
    const hideTextForMedia = !!embedUrl
        && isPureMediaUrl(embedUrl)
        && message.text?.trim() === embedUrl;

    return (<>
        {disabled || !isGrouped || message.replyTo || message.pinned ? (
        <div onMouseMove={() => !hovered && setHovered(true)}
             onMouseLeave={() => setHovered(false)}
             onContextMenu={handleContextMenu}
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
                        <HasUserPopup user={message.replyTo.user} serverId={serverId}>
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
                <HasUserPopup user={messageUser} serverId={serverId}>
                    <UserAvatar size="w-10 h-10 relative top-2" displayOnline={false} avatar={messageUser.avatar} icon={messageUser.username.charAt(0).toUpperCase()} />
                </HasUserPopup>
                <div className="flex flex-col w-full">
                    <div className="flex items-start gap-2">
                        <HasUserPopup user={messageUser} serverId={serverId} >
                            <span
                                className="text-lg mt-0.5 font-bold text-foreground hover:underline"
                                style={authorRoleColor ? { color: authorRoleColor } : undefined}
                            >
                                {messageUser.displayName ?? messageUser.username}
                            </span>
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
                            {message.text && !hideTextForMedia && (
                                <div className="flex">
                                    {parseMessageText(message.text, message.mentions).map((part, index) =>
                                        part.type === 'mention' ? (
                                            <MentionTag key={index} classes="w-max" mentionUser={part.mentionUser} serverId={serverId} content={part.content} />
                                        ) : part.type === 'special-mention' ? (
                                            <span key={index} className="bg-idle/15 text-idle rounded px-1 font-medium">{part.content}</span>
                                        ) : part.type === 'channel' ? (
                                            <span key={index} onClick={() => navigateToChannel(part.channelName)} className="w-max text-primary font-medium cursor-pointer hover:underline">
                                                {part.content}
                                            </span>
                                        ) : part.type === 'link' ? (
                                            parseInviteCode(part.href) ? (
                                                <span key={index} onClick={() => navigate(`/invite/${parseInviteCode(part.href)}`)} className="text-primary hover:underline break-all cursor-pointer">{part.content}</span>
                                            ) : (
                                                <a key={index} href={part.href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">{part.content}</a>
                                            )
                                        ) : (
                                            <span key={index}>{part.content}</span>
                                        )
                                    )}
                                </div>
                            )}
                            {inviteCode && <InviteCard code={inviteCode} />}
                            {message.type === 'poll' && message.poll && <PollMessage message={message} />}
                        </div>
                    )}
                    {message.attachments?.length > 0 && !isEditing && <MessageAttachments attachments={message.attachments} />}
                    {embedUrl && !isEditing && <LinkEmbed url={embedUrl} />}
                    <Reactions disabled={disabled} message={message} canReact={canReact} />
                </div>
                {!disabled && hovered && !isEditing && (
                    <MessageActionPopup message={message} onEdit={startEditing} />
                )}
            </div>
        </div>
    ) : (
        <div onMouseMove={() => !hovered && setHovered(true)}
             onMouseLeave={() => setHovered(false)}
             onContextMenu={handleContextMenu}
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
                                        <MentionTag key={index} classes="w-max" mentionUser={part.mentionUser} serverId={serverId} content={part.content} />
                                    ) : part.type === 'special-mention' ? (
                                        <span key={index} className="bg-idle/15 text-idle rounded px-1 font-medium">{part.content}</span>
                                    ) : part.type === 'channel' ? (
                                        <span key={index} onClick={() => navigateToChannel(part.channelName)} className="w-max text-primary font-medium cursor-pointer hover:underline">
                                        {part.content}
                                    </span>
                                    ) : part.type === 'link' ? (
                                        parseInviteCode(part.href) ? (
                                            <span key={index} onClick={() => navigate(`/invite/${parseInviteCode(part.href)}`)} className="text-primary hover:underline break-all cursor-pointer">{part.content}</span>
                                        ) : (
                                            <a key={index} href={part.href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">{part.content}</a>
                                        )
                                    ) : (
                                        <span key={index}>{part.content}</span>
                                    )
                                )}
                            </div>
                        )}
                        {inviteCode && <InviteCard code={inviteCode} />}
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
        )}
        {viewingReactions && (
            <ReactionViewerModal
                message={message}
                onClose={() => setViewingReactions(false)}
            />
        )}
        {showDeleteConfirm && (
            <ConfirmDeleteMessageDialog
                message={message}
                onConfirm={() => deleteMessage(roomType, message.id)}
                onCancel={() => setShowDeleteConfirm(false)}
            />
        )}
    </>);
}
export default MessageItem;