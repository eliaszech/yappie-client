import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faArrowTurnRight, faEllipsis, faPencil, faTrash} from "@awesome.me/kit-95376d5d61/icons/classic/regular";
import {deleteMessage} from "../../../hooks/messages/useDeleteMessage.js";


function MessageActionPopup({message}) {
    const roomType = message.conversationId ? 'conversation' : 'channel';

    return (
        <div className="absolute text-foreground hidden group-hover:flex right-0 border border-border -top-4 right-4 w-max bg-card rounded-lg bg-guild-bar shadow-lg z-10">
            <button className="cursor-pointer px-2 py-1 hover:bg-muted/50 rounded-tl-lg rounded-bl-lg"><FontAwesomeIcon icon={faPencil} /></button>
            <button className="cursor-pointer px-2 py-1 hover:bg-muted/50"><FontAwesomeIcon icon={faArrowTurnRight} /></button>
            <button className="cursor-pointer px-2 py-1 hover:bg-muted/50"><FontAwesomeIcon icon={faEllipsis} /></button>
            <button className="cursor-pointer px-2 py-1 hover:bg-dnd/10 rounded-tr-lg rounded-br-lg  text-dnd" onClick={() => deleteMessage(roomType, message.id)}><FontAwesomeIcon icon={faTrash} /></button>
        </div>
    )
}

export default MessageActionPopup;