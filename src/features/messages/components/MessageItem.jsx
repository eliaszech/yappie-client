import UserAvatar from "../../components/UserAvatar.jsx";
import {useIsOnline} from "../../../hooks/usePresence.js";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faSpinner} from "@awesome.me/kit-95376d5d61/icons/classic/light";
import {faRefresh, faSpinnerScale, faSpinnerThird, faSync} from "@awesome.me/kit-95376d5d61/icons/classic/regular";
import MessageActionPopup from "./MessageActionPopup.jsx";
import {useAuth} from "../../../hooks/useAuth.js";

function MessageItem({message, isGrouped = false}) {
    const { user } = useAuth();
    const { user: messageUser } = message;

    const dateTimeString = new Date(message.createdAt).toLocaleString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
    const timeString = dateTimeString.split(',')[1].trim();

    return !isGrouped ? (
        <div className="relative flex items-center gap-3 hover:bg-muted/50 mt-2 py-0.5 px-4 group">
            <UserAvatar size="w-10 h-10" displayOnline={false} avatar={messageUser.avatar} icon={messageUser.username.charAt(0).toUpperCase()} />
            <div className="flex flex-col">
                <div className="flex items-center gap-2">
                    <span className="text-base text-foreground font-bold">{messageUser.username}</span>
                    <span className="text-xs text-foreground/70">{dateTimeString}</span>
                </div>
                <span className={`${message.pending ? 'text-muted-foreground' : 'text-foreground'} text-base`}>
                    {message.text}
                    {message.pending && (
                        <span className="text-xs text-foreground ml-1"><FontAwesomeIcon spin={true} icon={faSpinnerThird} /></span>
                    )}
                </span>
            </div>
            {messageUser.id === user.id && (
                <MessageActionPopup message={message} />
            )}
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
            {messageUser.id === user.id && (
                <MessageActionPopup message={message} />
            )}
        </div>
    );
}
export default MessageItem;