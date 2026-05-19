import {getSocket} from "../../../services/socket.js";
import {useCallback, useEffect, useRef, useState} from "react";
import {useTyping} from "../../../hooks/useTyping.js";
import {useQueryClient} from "@tanstack/react-query";
import {useAuth} from "../../../hooks/useAuth.js";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faArrowTurnRight, faFaceSmile, faPlus, faTimesCircle, faFileLines, faPaperclip} from "@awesome.me/kit-95376d5d61/icons/classic/solid";
import {faXmark} from "@awesome.me/kit-95376d5d61/icons/classic/regular";
import {useReplyState} from "../../../hooks/messages/useReplyState.js";
import HasEmojiPicker from "./HasEmojiPicker.jsx";
import Suggestions from "./Suggestions.jsx";
import ChannelSuggestions from "./ChannelSuggestions.jsx";
import SlashCommandSuggestions from "./SlashCommandSuggestions.jsx";
import CreatePollDialog from "../dialogs/CreatePollDialog.jsx";
import GiphyPicker from "./GiphyPicker.jsx";
import { parseSlashInvocation } from "../slashCommands.js";
import {DefaultElement, Editable, ReactEditor, Slate, withReact} from "slate-react";
import {withHistory} from "slate-history";
import {createEditor, Editor, Range, Transforms} from "slate";
import {withMentions} from "../../plugins/slate/withMentions.js";
import MentionElement from "../../plugins/slate/MentionElement.jsx";
import ChannelMentionElement from "../../plugins/slate/ChannelMentionElement.jsx";
import {fetchServer, fetchChannels, uploadMessageFiles} from "../../../services/api.js";
import {hasPermission, hasChannelPermission, PERMISSIONS} from "../../../services/permissions.js";
import {useQuery} from "@tanstack/react-query";

const MENTION_SUGGESTIONS_REGEX = /(?<!\w)@(\w*)$/;
const CHANNEL_SUGGESTIONS_REGEX = /(?<!\S)#([\w-]*)$/;
const SLASH_SUGGESTIONS_REGEX = /^\/(\w*)$/;

const MAX_FILES = 10;
const MAX_FILE_SIZE = 25 * 1024 * 1024;
const BLOCKED_EXTS = new Set(['exe', 'msi', 'bat', 'cmd', 'com', 'scr', 'pif', 'ps1', 'vbs', 'js', 'jar', 'app', 'dmg']);

function getExt(filename) {
    const idx = filename.lastIndexOf('.');
    return idx === -1 ? '' : filename.slice(idx + 1).toLowerCase();
}

function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const initialValue = [
    { type: 'paragraph', children: [{ text: '' }] }
];

function MessageInput({roomName, type = 'conversation', roomId, serverId = null}) {
    const {user} = useAuth();
    const [editor] = useState(() => withMentions(withReact(withHistory(createEditor()))));
    const [input, setInput] = useState(initialValue);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [mentionQuery, setMentionQuery] = useState('');
    const [showChannelSuggestions, setShowChannelSuggestions] = useState(false);
    const [channelQuery, setChannelQuery] = useState('');
    const [showSlashSuggestions, setShowSlashSuggestions] = useState(false);
    const [slashQuery, setSlashQuery] = useState('');
    const [pollDialogQuestion, setPollDialogQuestion] = useState(null);
    const [giphyQuery, setGiphyQuery] = useState(null);
    const [suggestionsIndex, setSuggestionsIndex] = useState(0);
    const [attachments, setAttachments] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [attachmentError, setAttachmentError] = useState(null);
    const suggestionsRef = useRef(null);
    const channelSuggestionsRef = useRef(null);
    const slashSuggestionsRef = useRef(null);
    const fileInputRef = useRef(null);
    const dragCounterRef = useRef(0);
    const queryClient = useQueryClient();
    const { replyTo, clearReplyState } = useReplyState(roomId);
    const { typingUsers, sendTyping, stopTyping } = useTyping(type, roomId);
    const inputContainerRef = useRef(null);

    const { data: serverCtx } = useQuery({
        queryKey: ['server', serverId],
        queryFn: () => fetchServer(serverId),
        enabled: type === 'channel' && !!serverId,
        staleTime: 10 * 60 * 1000,
    });
    const { data: serverChannels = [] } = useQuery({
        queryKey: ['channels', serverId],
        queryFn: () => fetchChannels(serverId),
        enabled: type === 'channel' && !!serverId,
        staleTime: 10 * 60 * 1000,
    });
    // Effective per-channel mask carries server-base + overwrites already
    // (see backend getChannelPermissions), so a neutral overwrite still
    // resolves to the server-role bit.
    const channelObj = type === 'channel' ? serverChannels.find(c => c.id === roomId) : null;
    const canSend = type === 'conversation' || hasChannelPermission(channelObj, serverCtx, PERMISSIONS.SEND_MESSAGES);
    const canAttach = type === 'conversation' || hasChannelPermission(channelObj, serverCtx, PERMISSIONS.ATTACH_FILES);

    useEffect(() => {
        const ref = inputContainerRef.current;
        // When SEND_MESSAGES is missing we render the permission banner instead
        // of the editor, so the ref never attaches. Bail out cleanly.
        if (!ref) return;

        function handleFocusIn() {
            setShowSuggestions(true);
        }

        ref.addEventListener('focusin', handleFocusIn);
        return () => {
            ref.removeEventListener('focusin', handleFocusIn);
        }
    }, [canSend]);

    useEffect(() => {
        return () => {
            attachments.forEach(a => a.previewUrl && URL.revokeObjectURL(a.previewUrl));
        };
        // Only revoke on unmount; per-item revoke happens in removeAttachment.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function addFiles(fileList) {
        const incoming = Array.from(fileList || []);
        if (incoming.length === 0) return;

        const errors = [];
        const slots = MAX_FILES - attachments.length;
        if (slots <= 0) {
            setAttachmentError(`Maximal ${MAX_FILES} Dateien pro Nachricht.`);
            return;
        }

        const accepted = [];
        for (const file of incoming.slice(0, slots)) {
            if (file.size > MAX_FILE_SIZE) {
                errors.push(`${file.name}: zu groß (max. 25 MB)`);
                continue;
            }
            if (BLOCKED_EXTS.has(getExt(file.name))) {
                errors.push(`${file.name}: Dateityp nicht erlaubt`);
                continue;
            }
            const isImage = file.type.startsWith('image/');
            accepted.push({
                id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
                file,
                previewUrl: isImage ? URL.createObjectURL(file) : null,
            });
        }

        if (incoming.length > slots) {
            errors.push(`Nur die ersten ${slots} Datei(en) hinzugefügt — Limit ${MAX_FILES}.`);
        }

        if (accepted.length > 0) {
            setAttachments(prev => [...prev, ...accepted]);
        }
        setAttachmentError(errors.length > 0 ? errors.join(' · ') : null);
    }

    function removeAttachment(id) {
        setAttachments(prev => {
            const target = prev.find(a => a.id === id);
            if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
            return prev.filter(a => a.id !== id);
        });
        setAttachmentError(null);
    }

    function clearAttachments() {
        const urls = attachments.map(a => a.previewUrl).filter(Boolean);
        if (urls.length > 0) {
            setTimeout(() => urls.forEach(u => URL.revokeObjectURL(u)), 30_000);
        }
        setAttachments([]);
        setAttachmentError(null);
    }

    function handleInputChangeForSuggestions() {
        const { selection } = editor;

        if (!selection || !Range.isCollapsed(selection)) return;

        const [start] = Range.edges(selection);
        const lineStart = Editor.before(editor, start, { unit: 'line' });
        const range = lineStart && Editor.range(editor, lineStart, start);
        const textUpToCursor = range && Editor.string(editor, range);

        // Slash commands only trigger at the very start of an otherwise-empty
        // message — once the user has typed args (space) or any other content,
        // we get out of suggestion mode but the command still runs on send.
        const fullText = Editor.string(editor, []);
        const slashMatch = fullText.match(SLASH_SUGGESTIONS_REGEX);

        if (!textUpToCursor && !slashMatch) {
            setShowSuggestions(false);
            setMentionQuery('');
            setShowChannelSuggestions(false);
            setChannelQuery('');
            setShowSlashSuggestions(false);
            setSlashQuery('');
            return;
        }

        const mentionMatch = textUpToCursor.match(MENTION_SUGGESTIONS_REGEX);
        const channelMatch = textUpToCursor.match(CHANNEL_SUGGESTIONS_REGEX);

        if (slashMatch) {
            setSlashQuery(slashMatch[1]);
            setSuggestionsIndex(0);
            setShowSlashSuggestions(true);
            setShowSuggestions(false);
            setShowChannelSuggestions(false);
            setMentionQuery('');
            setChannelQuery('');
        } else if (mentionMatch) {
            setMentionQuery('@' + mentionMatch[1]);
            setSuggestionsIndex(0);
            setShowSuggestions(true);
            setShowChannelSuggestions(false);
            setChannelQuery('');
            setShowSlashSuggestions(false);
            setSlashQuery('');
        } else if (channelMatch && type === 'channel') {
            setChannelQuery('#' + channelMatch[1]);
            setSuggestionsIndex(0);
            setShowChannelSuggestions(true);
            setShowSuggestions(false);
            setMentionQuery('');
            setShowSlashSuggestions(false);
            setSlashQuery('');
        } else {
            setShowSuggestions(false);
            setMentionQuery('');
            setShowChannelSuggestions(false);
            setChannelQuery('');
            setShowSlashSuggestions(false);
            setSlashQuery('');
        }
    }

    function applySlashCommandSelection(cmd) {
        Transforms.select(editor, {
            anchor: Editor.start(editor, []),
            focus: Editor.end(editor, []),
        });
        Transforms.delete(editor);
        Transforms.insertText(editor, `/${cmd.name} `);
        ReactEditor.focus(editor);
        setShowSlashSuggestions(false);
        setSlashQuery('');
    }

    function insertMention(payload) {
        const { selection } = editor;
        if (!selection) return;

        const [start] = Range.edges(selection);
        const lineStart = Editor.before(editor, start, { unit: 'line' });
        const range = lineStart && Editor.range(editor, lineStart, start);
        const textUpToCursor = range && Editor.string(editor, range);

        if (!textUpToCursor) return;

        const mentionStart = textUpToCursor.lastIndexOf('@');
        if (mentionStart === -1) return;

        const atPoint = { path: start.path, offset: mentionStart };
        const mentionRange = Editor.range(editor, atPoint, start);

        Transforms.select(editor, mentionRange);
        Transforms.delete(editor);

        if (payload?.special) {
            Transforms.insertNodes(editor, {
                type: 'mention',
                kind: payload.special.kind,
                children: [{ text: '' }],
            });
        } else {
            Transforms.insertNodes(editor, {
                type: 'mention',
                userId: payload.id,
                username: payload.username,
                children: [{ text: '' }],
            });
        }

        Transforms.move(editor, { unit: 'offset' });
        ReactEditor.focus(editor);

        setShowSuggestions(false);
        setMentionQuery('');
    }

    function insertChannelMention(channel) {
        const { selection } = editor;
        if (!selection) return;

        const [start] = Range.edges(selection);
        const lineStart = Editor.before(editor, start, { unit: 'line' });
        const range = lineStart && Editor.range(editor, lineStart, start);
        const textUpToCursor = range && Editor.string(editor, range);

        if (!textUpToCursor) return;

        const hashStart = textUpToCursor.lastIndexOf('#');
        if (hashStart === -1) return;

        const hashPoint = { path: start.path, offset: hashStart };
        const channelRange = Editor.range(editor, hashPoint, start);

        Transforms.select(editor, channelRange);
        Transforms.delete(editor);
        Transforms.insertNodes(editor, {
            type: 'channel-mention',
            channelId: channel.id,
            channelName: channel.name,
            children: [{ text: '' }],
        });

        Transforms.move(editor, { unit: 'offset' });
        ReactEditor.focus(editor);

        setShowChannelSuggestions(false);
        setChannelQuery('');
    }

    function getPlainText(nodes) {
        return nodes.map(n => {
            if (n.type === 'mention') {
                if (n.kind === 'everyone') return '@everyone';
                if (n.kind === 'here') return '@here';
                return `@${n.username}`;
            }
            if (n.type === 'channel-mention') return `#${n.channelName}`;
            if (n.children) return getPlainText(n.children);
            return n.text ?? '';
        }).join('');
    }

    function getMentionedUserIds(nodes) {
        const ids = [];
        for (const node of nodes) {
            if (node.type === 'mention' && node.userId) ids.push(node.userId);
            if (node.children) ids.push(...getMentionedUserIds(node.children));
        }
        return [...new Set(ids)];
    }

    function getSpecialMentions(nodes) {
        let everyone = false;
        let here = false;
        for (const node of nodes) {
            if (node.type === 'mention') {
                if (node.kind === 'everyone') everyone = true;
                if (node.kind === 'here') here = true;
            }
            if (node.children) {
                const inner = getSpecialMentions(node.children);
                everyone = everyone || inner.everyone;
                here = here || inner.here;
            }
        }
        return { everyone, here };
    }

    function resetEditor() {
        Transforms.select(editor, {
            anchor: Editor.start(editor, []),
            focus: Editor.end(editor, []),
        });
        Transforms.delete(editor);
        if (editor.children.length === 0) {
            Transforms.insertNodes(editor, {
                type: 'paragraph',
                children: [{ text: '' }],
            });
        }
        setInput(initialValue);
    }

    async function sendMessage() {
        let plainText = getPlainText(input).trimEnd();

        // Slash-command interception. Runs before the regular send path.
        const invocation = plainText.startsWith('/') ? parseSlashInvocation(plainText) : null;
        if (invocation) {
            if (invocation.def.requiresArgs && !invocation.args) return;
            const result = invocation.def.run({ args: invocation.args });
            if (result.kind === 'open-poll') {
                setPollDialogQuestion(result.question || '');
                resetEditor();
                clearReplyState();
                stopTyping();
                return;
            }
            if (result.kind === 'open-giphy') {
                setGiphyQuery(result.query || '');
                resetEditor();
                clearReplyState();
                stopTyping();
                return;
            }
            if (result.kind === 'send-text') {
                plainText = result.text;
                if (!plainText) return;
            }
        }

        if (!plainText.trim() && attachments.length === 0) return;
        if (isUploading) return;

        const mentionedUserIds = getMentionedUserIds(input);
        const { everyone: mentionEveryone, here: mentionHere } = getSpecialMentions(input);
        const socket = getSocket();

        let uploadedAttachments = [];
        if (attachments.length > 0) {
            setIsUploading(true);
            const res = await uploadMessageFiles(attachments.map(a => a.file));
            setIsUploading(false);
            if (res?.error) {
                setAttachmentError(res.error);
                return;
            }
            uploadedAttachments = res;
        }

        const localAttachmentsForTemp = attachments.map((a, i) => ({
            id: `temp-att-${i}`,
            url: a.previewUrl || '',
            filename: a.file.name,
            mimeType: a.file.type,
            size: a.file.size,
            width: null,
            height: null,
        }));

        const tempMessage = {
            id: `temp-${Date.now()}`,
            text: plainText,
            userId: user.id,
            user: user,
            roomId,
            mentions: [],
            attachments: localAttachmentsForTemp,
            createdAt: new Date().toISOString(),
            pending: true,
        };

        queryClient.setQueryData(['messages', roomId], (old) => {
            if (!old) return old;
            return {
                ...old,
                messages: [...old.messages, tempMessage]
            };
        });

        // Stop typing BEFORE the message goes out — otherwise remote clients
        // briefly see "X is typing…" right after the new message lands.
        stopTyping();

        socket.emit('message:send', {
            type, roomId,
            text: plainText,
            replyToId: replyTo?.id || null,
            mentionedUserIds,
            mentionEveryone,
            mentionHere,
            attachmentIds: uploadedAttachments.map(a => a.id),
        });

        resetEditor();
        clearAttachments();
        clearReplyState();
    }

    const typingUsersString = typingUsers.map((typingUser) => typingUser.username).join(', ');
    const roomNamePrefix = type === 'conversation' ? '' : '#';

    const renderElement = useCallback((props) => {
        if (props.element.type === 'mention') return <MentionElement {...props} />;
        if (props.element.type === 'channel-mention') return <ChannelMentionElement {...props} />;
        return <DefaultElement {...props} />;
    }, []);

    const bottomOffset = replyTo ? 'bottom-28' : 'bottom-18';

    function handleDragEnter(e) {
        if (!e.dataTransfer?.types?.includes('Files')) return;
        e.preventDefault();
        dragCounterRef.current += 1;
        setIsDragging(true);
    }

    function handleDragLeave(e) {
        if (!e.dataTransfer?.types?.includes('Files')) return;
        e.preventDefault();
        dragCounterRef.current = Math.max(0, dragCounterRef.current - 1);
        if (dragCounterRef.current === 0) setIsDragging(false);
    }

    function handleDragOver(e) {
        if (!e.dataTransfer?.types?.includes('Files')) return;
        e.preventDefault();
    }

    function handleDrop(e) {
        if (!e.dataTransfer?.types?.includes('Files')) return;
        e.preventDefault();
        dragCounterRef.current = 0;
        setIsDragging(false);
        addFiles(e.dataTransfer.files);
    }

    function handlePaste(e) {
        const files = e.clipboardData?.files;
        if (files && files.length > 0) {
            e.preventDefault();
            addFiles(files);
        }
    }

    if (!canSend) {
        return (
            <div className="relative h-max flex flex-col px-1.5 pb-2">
                <div className="w-full rounded-lg border border-border bg-card/60 px-4 py-3 text-sm text-muted-foreground text-center">
                    Du hast keine Berechtigung, in diesem Kanal zu schreiben.
                </div>
            </div>
        );
    }

    return (
        <div
            ref={inputContainerRef}
            className="relative h-max flex flex-col px-1.5 pb-2 z-3"
            onDragEnter={canAttach ? handleDragEnter : undefined}
            onDragOver={canAttach ? handleDragOver : undefined}
            onDragLeave={canAttach ? handleDragLeave : undefined}
            onDrop={canAttach ? handleDrop : undefined}
        >
            <input
                ref={fileInputRef}
                type="file"
                multiple
                hidden
                onChange={(e) => {
                    addFiles(e.target.files);
                    e.target.value = '';
                }}
            />
            { isDragging && (
                <div className="absolute inset-1.5 z-30 flex items-center justify-center rounded-lg border-2 border-dashed border-primary bg-primary/15 backdrop-blur-sm pointer-events-none">
                    <div className="flex flex-col items-center text-primary">
                        <FontAwesomeIcon icon={faPaperclip} className="text-3xl mb-1" />
                        <span className="font-medium">Dateien hier ablegen</span>
                    </div>
                </div>
            )}
            { typingUsers.length > 0 && (
                <div className="absolute animate animate-pulse -top-6 rounded-lg text-xs bg-transparent text-foreground w-full px-2 py-1">{typingUsersString} is typing...</div>
            )}
            { showSuggestions && mentionQuery.length > 0 && (
                <Suggestions
                    ref={suggestionsRef}
                    type={type === 'conversation' ? 'participants' : 'members'}
                    bottom={bottomOffset}
                    serverId={type === 'conversation' ? roomId : serverId}
                    query={mentionQuery}
                    selectedIndex={suggestionsIndex}
                    clickFunction={(member) => insertMention(member)}
                    hideFunction={() => { setShowSuggestions(false); setMentionQuery(''); }}
                />
            )}
            { showChannelSuggestions && channelQuery.length > 0 && (
                <ChannelSuggestions
                    ref={channelSuggestionsRef}
                    serverId={serverId}
                    query={channelQuery}
                    bottom={bottomOffset}
                    selectedIndex={suggestionsIndex}
                    clickFunction={(channel) => insertChannelMention(channel)}
                    hideFunction={() => { setShowChannelSuggestions(false); setChannelQuery(''); }}
                />
            )}
            { showSlashSuggestions && (
                <SlashCommandSuggestions
                    ref={slashSuggestionsRef}
                    query={slashQuery}
                    bottom={bottomOffset}
                    selectedIndex={suggestionsIndex}
                    clickFunction={(cmd) => applySlashCommandSelection(cmd)}
                    hideFunction={() => { setShowSlashSuggestions(false); setSlashQuery(''); }}
                />
            )}
            { pollDialogQuestion !== null && (
                <CreatePollDialog
                    type={type}
                    roomId={roomId}
                    initialQuestion={pollDialogQuestion}
                    onClose={() => setPollDialogQuestion(null)}
                />
            )}
            { giphyQuery !== null && (
                <GiphyPicker
                    initialQuery={giphyQuery}
                    onClose={() => setGiphyQuery(null)}
                    onSelect={(gif) => {
                        // Send the GIF URL as a plain message; ImageEmbed
                        // picks up the .gif extension and renders it inline.
                        const socket = getSocket();
                        if (!socket || !gif?.url) return;
                        socket.emit('message:send', {
                            type, roomId,
                            text: gif.url,
                            mentionedUserIds: [],
                            mentionEveryone: false,
                            mentionHere: false,
                            attachmentIds: [],
                        });
                    }}
                />
            )}
            <div className="flex flex-col items-center h-max relative bg-card rounded-lg border border-border">
                { replyTo && (
                    <div className="flex w-full justify-between items-center rounded-t-lg border-b border-border px-4 py-2 bg-guild-bar">
                        <div className="text-xs  text-foreground w-full">
                            <FontAwesomeIcon className="mr-1" icon={faArrowTurnRight} />
                            Replying to <b>{replyTo.user.username}</b>
                        </div>
                        <button onClick={() => clearReplyState()} className="text-foreground cursor-pointer"><FontAwesomeIcon icon={faTimesCircle} /></button>
                    </div>
                )}
                { attachments.length > 0 && (
                    <div className="w-full border-b border-border px-3 py-2.5">
                        <div className="flex gap-2 flex-wrap">
                            {attachments.map(att => (
                                <div key={att.id} className="relative group bg-muted/60 rounded-md border border-border overflow-hidden">
                                    {att.previewUrl ? (
                                        <div className="w-24 h-24 flex items-center justify-center">
                                            <img src={att.previewUrl} alt={att.file.name} className="w-full h-full object-cover" />
                                        </div>
                                    ) : (
                                        <div className="w-44 h-24 px-3 flex items-center gap-2.5">
                                            <FontAwesomeIcon icon={faFileLines} className="text-2xl text-muted-foreground shrink-0" />
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-xs font-medium text-foreground truncate" title={att.file.name}>{att.file.name}</span>
                                                <span className="text-[10px] text-muted-foreground">{formatBytes(att.file.size)}</span>
                                            </div>
                                        </div>
                                    )}
                                    <button
                                        onClick={() => removeAttachment(att.id)}
                                        title="Entfernen"
                                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-card/90 hover:bg-card border border-border text-foreground flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity text-[10px]"
                                    >
                                        <FontAwesomeIcon icon={faXmark} />
                                    </button>
                                </div>
                            ))}
                        </div>
                        {attachmentError && (
                            <div className="text-xs text-red-400 mt-1.5">{attachmentError}</div>
                        )}
                    </div>
                )}
                { attachments.length === 0 && attachmentError && (
                    <div className="w-full border-b border-border px-3 py-2 text-xs text-red-400">{attachmentError}</div>
                )}
                <div className="flex w-full h-max items-center relative">
                    {canAttach && (
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            title="Datei anhängen"
                            className="absolute z-10 left-3 top-3 cursor-pointer text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg px-1 py-1"
                        >
                            <FontAwesomeIcon icon={faPlus} />
                        </button>
                    )}
                    <Slate editor={editor} initialValue={initialValue} onValueChange={(newValue) => {
                        setInput(newValue);
                        handleInputChangeForSuggestions();
                        sendTyping();
                    }}>
                        <Editable
                            renderElement={renderElement}
                            // break-all + min-w-0 so a pasted multi-hundred-char
                            // URL wraps inside the input instead of pushing the
                            // whole composer off-screen.
                            className="pt-4 min-h-[56px] pb-4 w-full min-w-0 pl-12 pr-12 outline-none text-foreground placeholder:text-muted-foreground! rounded-lg focus:ring-2 focus:ring-primary/80 transition-colors break-all whitespace-pre-wrap"
                            placeholder={isUploading ? 'Lade hoch...' : `Nachricht an ${roomNamePrefix}${roomName} schreiben...`}
                            onPaste={handlePaste}
                            onKeyDown={(e) => {
                                e.stopPropagation();

                                const suggestionsOpen = (showSuggestions && mentionQuery.length > 0) ||
                                                        (showChannelSuggestions && channelQuery.length > 0) ||
                                                        showSlashSuggestions;

                                if (suggestionsOpen) {
                                    if (e.key === 'ArrowDown') {
                                        e.preventDefault();
                                        setSuggestionsIndex(i => i + 1);
                                        return;
                                    }
                                    if (e.key === 'ArrowUp') {
                                        e.preventDefault();
                                        setSuggestionsIndex(i => Math.max(0, i - 1));
                                        return;
                                    }
                                    if (e.key === 'Enter' || e.key === 'Tab') {
                                        e.preventDefault();
                                        if (showSuggestions) suggestionsRef.current?.selectCurrent();
                                        else if (showChannelSuggestions) channelSuggestionsRef.current?.selectCurrent();
                                        else if (showSlashSuggestions) slashSuggestionsRef.current?.selectCurrent();
                                        return;
                                    }
                                    if (e.key === 'Escape') {
                                        setShowSuggestions(false);
                                        setMentionQuery('');
                                        setShowChannelSuggestions(false);
                                        setChannelQuery('');
                                        setShowSlashSuggestions(false);
                                        setSlashQuery('');
                                        return;
                                    }
                                }

                                if (!e.shiftKey && e.key === 'Enter') {
                                    e.preventDefault();
                                    sendMessage();
                                }
                            }}
                        />
                    </Slate>

                    <div className="absolute right-3 top-3 z-10 h-full gap-2">
                        <HasEmojiPicker position="top" orientation="right" onSelect={(emoji) => {
                            ReactEditor.focus(editor);
                            Transforms.insertText(editor, emoji);
                        }}>
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