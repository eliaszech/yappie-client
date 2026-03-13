import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {
    faArrowTurnRight,
    faEllipsis,
    faPen,
    faTrash,
    faFaceSmile, faArrowTurnLeft
} from "@awesome.me/kit-95376d5d61/icons/classic/solid";
import {useReplyState} from "../../../hooks/messages/useReplyState.js";
import {useAuth} from "../../../hooks/useAuth.js";
import {useState} from "react";
import ConfirmDeleteMessageDialog from "../dialogs/ConfirmDeleteMessageDialog.jsx";
import {deleteMessage} from "../../../hooks/messages/useDeleteMessage.js";
import HasEmojiPicker from "./HasEmojiPicker.jsx";
import {toggleReaction} from "../../../hooks/messages/useReactMessage.js";


function MessageActionPopup({message}) {
    const { user } = useAuth();
    const roomType = message.conversationId ? 'conversation' : 'channel';
    const { setReplyState } = useReplyState(roomType === 'channel' ? message.channelId : message.conversationId);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    return (
        <>
            <div className="absolute text-foreground hidden group-hover:flex right-0 border border-border -top-4 right-4 w-max bg-card rounded-lg bg-guild-bar shadow-lg z-10">
                <button onClick={() => toggleReaction(message.id, '👍')} className="cursor-pointer px-1.5 py-1.25 hover:bg-muted/50 rounded-tl-lg rounded-bl-lg">👍</button>
                <button onClick={() => toggleReaction(message.id, '🔥')} className="cursor-pointer px-1.5 py-1.25 hover:bg-muted/50">🔥</button>
                <button onClick={() => toggleReaction(message.id, '😂')} className="cursor-pointer px-1.5 py-1.25 hover:bg-muted/50 border-r border-border">😂</button>
                <HasEmojiPicker onSelect={() => {}} position="top" orientation="right">
                    <button className="cursor-pointer px-1.5 py-1.25 hover:bg-muted/50"><FontAwesomeIcon icon={faFaceSmile} /></button>
                </HasEmojiPicker>
                {message.user.id === user.id && (
                    <button className="cursor-pointer px-1.5 py-1.25 hover:bg-muted/50 "><FontAwesomeIcon icon={faPen} /></button>
                )}
                <button className="cursor-pointer px-1.5 py-1.25 hover:bg-muted/50" onClick={() => setReplyState(message)}><FontAwesomeIcon icon={faArrowTurnLeft} /></button>
                <button className="cursor-pointer px-1.5 py-1.25 hover:bg-muted/50"><FontAwesomeIcon icon={faEllipsis} /></button>
                {message.user.id === user.id && (
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