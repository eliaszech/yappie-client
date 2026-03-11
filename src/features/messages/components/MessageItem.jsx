import UserAvatar from "../../components/UserAvatar.jsx";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faSpinnerThird} from "@awesome.me/kit-95376d5d61/icons/classic/regular";
import MessageActionPopup from "./MessageActionPopup.jsx";
import {useAuth} from "../../../hooks/useAuth.js";
import {useReplyState} from "../../../hooks/messages/useReplyState.js";

function MessageItem({message, isGrouped = false, disabled = false}) {
    const { user: messageUser } = message;

    const dateTimeString = new Date(message.createdAt).toLocaleString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
    const timeString = dateTimeString.split(',')[1].trim();

    return disabled || !isGrouped || message.replyTo ? (
        <div className={`${disabled ? 'pointer-events-none' : ''} relative flex flex-col mt-4 group hover:bg-muted/50`}>
            {message.replyTo && (
                <div className="flex items-center bg-primary/3  py-1 pl-4 relative">
                    <div className="absolute top-1/2 left-8 w-6 h-3 border-l-2 border-t-2 border-primary/80 rounded-tl-md"></div>
                    <span className="text-sm text-primary/80 pl-13">
                        Antwort an {message.replyTo.user.username}: {message.replyTo.text.slice(0, 100)}
                    </span>
                </div>
            )}
            <div className={`flex items-center gap-3  px-4 py-0.5`}>
                <UserAvatar size="w-10 h-10" displayOnline={false} avatar={messageUser.avatar} icon={messageUser.username.charAt(0).toUpperCase()} />
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <span className="text-lg text-foreground font-bold">{messageUser.username}</span>
                        <span className="text-sm text-muted-foreground">{dateTimeString}</span>
                    </div>
                    <span className={`${message.pending ? 'text-muted-foreground' : 'text-foreground'} text-base`}>
                        {message.text}
                        {message.pending && (
                            <span className="text-xs text-foreground ml-1"><FontAwesomeIcon spin={true} icon={faSpinnerThird} /></span>
                        )}
                    </span>
                </div>
                {!disabled && (
                    <MessageActionPopup message={message} />
                )}
            </div>
        </div>
    ) : (
        <div className="relative flex items-center pl-6 pr-4 hover:bg-muted/50 py-0.5 group">
            <span className="w-11 text-[10px] text-foreground/70 opacity-0 group-hover:opacity-100">{timeString}</span>
            <span className={`${message.pending ? 'text-foreground animate animate-pulse' : 'text-foreground'} text-base flex items-center`}>
                {message.text}
                {message.pending && (
                    <span className="text-xs text-foreground ml-1"><FontAwesomeIcon spin={true} icon={faSpinnerThird} /></span>
                )}
            </span>
            <MessageActionPopup message={message} />
        </div>
    );
}
export default MessageItem;