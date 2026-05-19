import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {
    faEllipsis,
    faPen,
    faTrash,
    faFaceSmile, faArrowTurnLeft,
    faThumbtack,
    faThumbtackSlash
} from "@awesome.me/kit-95376d5d61/icons/classic/solid";
import {useReplyState} from "../../../hooks/messages/useReplyState.js";
import {useAuth} from "../../../hooks/useAuth.js";
import {useState} from "react";
import {useParams} from "react-router-dom";
import {useQuery, useQueryClient} from "@tanstack/react-query";
import ConfirmDeleteMessageDialog from "../dialogs/ConfirmDeleteMessageDialog.jsx";
import {deleteMessage} from "../../../hooks/messages/useDeleteMessage.js";
import HasEmojiPicker from "./HasEmojiPicker.jsx";
import {toggleReaction} from "../../../hooks/messages/useReactMessage.js";
import {fetchServer, pinMessage, unpinMessage} from "../../../services/api.js";
import {hasPermission, PERMISSIONS} from "../../../services/permissions.js";


function MessageActionPopup({message, onEdit}) {
    const { user } = useAuth();
    const { serverId } = useParams();
    const queryClient = useQueryClient();
    const roomType = message.conversationId ? 'conversation' : 'channel';
    const { setReplyState } = useReplyState(roomType === 'channel' ? message.channelId : message.conversationId);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const { data: server } = useQuery({
        queryKey: ['server', serverId],
        queryFn: () => fetchServer(serverId),
        enabled: roomType === 'channel' && !!serverId,
        staleTime: 10 * 60 * 1000,
    });

    const canPin = roomType === 'channel' && hasPermission(server, PERMISSIONS.PIN_MESSAGES);
    const isOwnMessage = message.user.id === user.id;
    const canDelete = isOwnMessage
        || (roomType === 'channel' && hasPermission(server, PERMISSIONS.MANAGE_MESSAGES))
        || roomType === 'conversation'; // DMs: only own messages would be visible here anyway

    async function togglePin() {
        const channelId = message.channelId;
        const messageId = message.id;
        const willPin = !message.pinned;

        queryClient.setQueryData(['messages', channelId], (old) => {
            if (!old) return old;
            return {
                ...old,
                messages: old.messages.map(m =>
                    m.id === messageId ? { ...m, pinned: willPin } : m
                ),
            };
        });

        if (willPin) await pinMessage(channelId, messageId);
        else await unpinMessage(channelId, messageId);
    }

    return (
        <>
            <div className="absolute text-foreground hidden group-hover:flex right-0 border border-border -top-4 right-4 w-max rounded-lg bg-guild-bar shadow-lg z-10">
                <button onClick={() => toggleReaction(message.id, '👍')} className="cursor-pointer px-1.5 py-1.25 hover:bg-muted/50 rounded-tl-lg rounded-bl-lg">👍</button>
                <button onClick={() => toggleReaction(message.id, '🔥')} className="cursor-pointer px-1.5 py-1.25 hover:bg-muted/50">🔥</button>
                <button onClick={() => toggleReaction(message.id, '😂')} className="cursor-pointer px-1.5 py-1.25 hover:bg-muted/50 border-r border-border">😂</button>
                <HasEmojiPicker onSelect={(emoji) => toggleReaction(message.id, emoji)} position="top" orientation="right">
                    <button className="cursor-pointer px-1.5 py-1.25 hover:bg-muted/50"><FontAwesomeIcon icon={faFaceSmile} /></button>
                </HasEmojiPicker>
                {message.user.id === user.id && (
                    <button className="cursor-pointer px-1.5 py-1.25 hover:bg-muted/50" onClick={onEdit}><FontAwesomeIcon icon={faPen} /></button>
                )}
                <button className="cursor-pointer px-1.5 py-1.25 hover:bg-muted/50" onClick={() => setReplyState(message)}><FontAwesomeIcon icon={faArrowTurnLeft} /></button>
                {canPin && (
                    <button className="cursor-pointer px-1.5 py-1.25 hover:bg-muted/50"
                            onClick={togglePin}
                            title={message.pinned ? 'Anpinnen entfernen' : 'Anpinnen'}>
                        <FontAwesomeIcon icon={message.pinned ? faThumbtackSlash : faThumbtack} />
                    </button>
                )}
                <button className="cursor-pointer px-1.5 py-1.25 hover:bg-muted/50"><FontAwesomeIcon icon={faEllipsis} /></button>
                {canDelete && (isOwnMessage || roomType === 'channel') && (
                    <button className="cursor-pointer px-1.5 py-1.25 hover:bg-dnd/10 rounded-tr-lg rounded-br-lg  text-dnd"
                            onClick={(e) => e.shiftKey ? deleteMessage(roomType, message.id) : setShowDeleteConfirm(true)}>
                        <FontAwesomeIcon icon={faTrash} />
                    </button>
                )}
            </div>
            {showDeleteConfirm && (
                <ConfirmDeleteMessageDialog
                    message={message}
                    onConfirm={() => deleteMessage(roomType, message.id)}
                    onCancel={() => setShowDeleteConfirm(false)}/>
            )}
        </>

    )
}

export default MessageActionPopup;