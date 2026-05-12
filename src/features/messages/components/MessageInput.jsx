import {getSocket} from "../../../services/socket.js";
import {useCallback, useEffect, useRef, useState} from "react";
import {useTyping} from "../../../hooks/useTyping.js";
import {useQueryClient} from "@tanstack/react-query";
import {useAuth} from "../../../hooks/useAuth.js";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faArrowTurnRight, faFaceSmile, faPlus, faTimesCircle} from "@awesome.me/kit-95376d5d61/icons/classic/solid";
import {useReplyState} from "../../../hooks/messages/useReplyState.js";
import HasEmojiPicker from "./HasEmojiPicker.jsx";
import Suggestions from "./Suggestions.jsx";
import ChannelSuggestions from "./ChannelSuggestions.jsx";
import {DefaultElement, Editable, ReactEditor, Slate, withReact} from "slate-react";
import {withHistory} from "slate-history";
import {createEditor, Editor, Range, Transforms} from "slate";
import {withMentions} from "../../plugins/slate/withMentions.js";
import MentionElement from "../../plugins/slate/MentionElement.jsx";
import ChannelMentionElement from "../../plugins/slate/ChannelMentionElement.jsx";

const MENTION_SUGGESTIONS_REGEX = /(?<!\w)@(\w*)$/;
const CHANNEL_SUGGESTIONS_REGEX = /(?<!\S)#([\w-]*)$/;
const MENTION_PARSE_REGEX = /@(\w+)/g;

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
    const [suggestionsIndex, setSuggestionsIndex] = useState(0);
    const suggestionsRef = useRef(null);
    const channelSuggestionsRef = useRef(null);
    const queryClient = useQueryClient();
    const { replyTo, clearReplyState } = useReplyState(roomId);
    const { typingUsers, sendTyping, stopTyping } = useTyping(type, roomId);
    const inputContainerRef = useRef(null);

    useEffect(() => {
        const ref = inputContainerRef.current;

        function handleFocusIn() {
            setShowSuggestions(true);
        }

        ref.addEventListener('focusin', handleFocusIn);
        return () => {
            ref.removeEventListener('focusin', handleFocusIn);
        }
    }, []);

    function handleInputChangeForSuggestions() {
        const { selection } = editor;

        if (!selection || !Range.isCollapsed(selection)) return;

        const [start] = Range.edges(selection);
        const lineStart = Editor.before(editor, start, { unit: 'line' });
        const range = lineStart && Editor.range(editor, lineStart, start);
        const textUpToCursor = range && Editor.string(editor, range);

        if (!textUpToCursor) {
            setShowSuggestions(false);
            setMentionQuery('');
            setShowChannelSuggestions(false);
            setChannelQuery('');
            return;
        }

        const mentionMatch = textUpToCursor.match(MENTION_SUGGESTIONS_REGEX);
        const channelMatch = textUpToCursor.match(CHANNEL_SUGGESTIONS_REGEX);

        if (mentionMatch) {
            setMentionQuery('@' + mentionMatch[1]);
            setSuggestionsIndex(0);
            setShowSuggestions(true);
            setShowChannelSuggestions(false);
            setChannelQuery('');
        } else if (channelMatch && type === 'channel') {
            setChannelQuery('#' + channelMatch[1]);
            setSuggestionsIndex(0);
            setShowChannelSuggestions(true);
            setShowSuggestions(false);
            setMentionQuery('');
        } else {
            setShowSuggestions(false);
            setMentionQuery('');
            setShowChannelSuggestions(false);
            setChannelQuery('');
        }
    }

    function insertMention(user) {
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
        Transforms.insertNodes(editor, {
            type: 'mention',
            userId: user.id,
            username: user.username,
            children: [{ text: '' }],
        });

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
            if (n.type === 'mention') return `@${n.username}`;
            if (n.type === 'channel-mention') return `#${n.channelName}`;
            if (n.children) return getPlainText(n.children);
            return n.text ?? '';
        }).join('');
    }

    function getMentionedUserIds(nodes) {
        const ids = [];
        for (const node of nodes) {
            if (node.type === 'mention') ids.push(node.userId);
            if (node.children) ids.push(...getMentionedUserIds(node.children));
        }
        return [...new Set(ids)];
    }

    function sendMessage() {
        const plainText = getPlainText(input).trimEnd();
        if (!plainText.trim()) return;

        const mentionedUserIds = getMentionedUserIds(input);
        const socket = getSocket();

        const tempMessage = {
            id: `temp-${Date.now()}`,
            text: plainText,
            userId: user.id,
            user: user,
            roomId,
            mentions: [],
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

        socket.emit('message:send', {
            type, roomId,
            text: plainText,
            replyToId: replyTo?.id || null,
            mentionedUserIds,
        });

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
        clearReplyState();
        stopTyping();
    }

    const typingUsersString = typingUsers.map((typingUser) => typingUser.username).join(', ');
    const roomNamePrefix = type === 'conversation' ? '' : '#';

    const renderElement = useCallback((props) => {
        if (props.element.type === 'mention') return <MentionElement {...props} />;
        if (props.element.type === 'channel-mention') return <ChannelMentionElement {...props} />;
        return <DefaultElement {...props} />;
    }, []);

    const bottomOffset = replyTo ? 'bottom-28' : 'bottom-18';

    return (
        <div ref={inputContainerRef} className="relative h-max flex flex-col px-1.5 pb-2 z-3">
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
                <div className="flex w-full h-max items-center relative">
                    <button className="absolute z-10 left-3 top-3 cursor-pointer text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg px-1 py-1">
                        <FontAwesomeIcon icon={faPlus} className="" />
                    </button>
                    <Slate editor={editor} initialValue={initialValue} onValueChange={(newValue) => {
                        setInput(newValue);
                        handleInputChangeForSuggestions();
                        sendTyping();
                    }}>
                        <Editable
                            renderElement={renderElement}
                            className="pt-4 min-h-[56px] pb-4 w-full pl-12 pr-12 outline-none text-foreground placeholder:text-muted-foreground! rounded-lg focus:ring-2 focus:ring-primary/80 transition-colors"
                            placeholder={`Nachricht an ${roomNamePrefix}${roomName} schreiben...`}
                            onKeyDown={(e) => {
                                e.stopPropagation();

                                const suggestionsOpen = (showSuggestions && mentionQuery.length > 0) ||
                                                        (showChannelSuggestions && channelQuery.length > 0);

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
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        if (showSuggestions) suggestionsRef.current?.selectCurrent();
                                        else channelSuggestionsRef.current?.selectCurrent();
                                        return;
                                    }
                                    if (e.key === 'Escape') {
                                        setShowSuggestions(false);
                                        setMentionQuery('');
                                        setShowChannelSuggestions(false);
                                        setChannelQuery('');
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
