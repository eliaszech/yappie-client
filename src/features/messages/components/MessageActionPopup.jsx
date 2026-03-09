import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faEllipsis, faPencil, faTrash} from "@awesome.me/kit-95376d5d61/icons/classic/regular";
import {getSocket} from "../../../services/socket.js";


function MessageActionPopup({message}) {
    function deleteMessage() {
        const socket = getSocket()

        socket.emit('message:tryDelete', { messageId: message.id });
    }

    return (
        <div className="absolute text-foreground hidden divide-x divide-border group-hover:flex right-0 border border-border -top-3 right-4 w-max bg-guild-bar rounded-lg bg-card shadow-lg z-10">
            <button className="cursor-pointer px-2 py-1 hover:bg-muted/50 rounded-tl-lg rounded-bl-lg"><FontAwesomeIcon icon={faPencil} /></button>
            <button className="cursor-pointer px-2 py-1 hover:bg-dnd/10 text-dnd" onClick={deleteMessage}><FontAwesomeIcon icon={faTrash} /></button>
            <button className="cursor-pointer px-2 py-1 hover:bg-muted/50 rounded-tr-lg rounded-br-lg"><FontAwesomeIcon icon={faEllipsis} /></button>
        </div>
    )
}

export default MessageActionPopup;