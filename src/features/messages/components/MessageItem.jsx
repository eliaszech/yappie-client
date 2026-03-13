import UserAvatar from "../../components/UserAvatar.jsx";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faSpinnerThird} from "@awesome.me/kit-95376d5d61/icons/classic/regular";
import MessageActionPopup from "./MessageActionPopup.jsx";
import HasUserPopup from "../../components/user/HasUserPopup.jsx";
import Reactions from "./Reactions.jsx";
import {useState} from "react";
import {useReplyState} from "../../../hooks/messages/useReplyState.js";

function MessageItem({message, isGrouped = false, disabled = false}) {
    const { user: messageUser } = message;
    const { replyTo } = useReplyState(message.conversationId || message.channelId);

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

        element.classList.add('bg-primary/10');
        setTimeout(() => {
            element.classList.remove('bg-primary/10');
        }, 1500);
    }

    return disabled || !isGrouped || message.replyTo ? (
        <div id={`message-${message.id}`} className={`${disabled ? 'pointer-events-none' : ''} ${replyTo && replyTo.id === message.id ? 'bg-primary/10 border-l-2 border-primary hover:bg-primary/15' : 'hover:bg-muted/50'} relative flex flex-col mt-4 transition-colors duration-300  group`}>
            {message.replyTo && (
                <div onClick={() => scrollToMessage(message.replyTo.id)} className="flex items-center bg-primary/3  py-1 pl-4 relative hover:bg-primary/10 cursor-pointer">
                    <div className="absolute top-1/2 left-8 w-6 h-3 border-l-2 border-t-2 border-primary/80 rounded-tl-md"></div>
                    <span className="text-sm flex items-center text-primary/80 pl-13 overflow-hidden">
                        <span className="mr-1 shrink-0">Antwort an</span>
                        <HasUserPopup user={message.replyTo.user}>
                            <div className="flex items-center hover:underline">
                                <UserAvatar size="w-3.5 h-3.5 text-xs" displayOnline={false} icon={message.replyTo.user.username.charAt(0).toUpperCase()} />
                                <span className="ml-1 mr-1">{message.replyTo.user.username}: </span>
                            </div>
                        </HasUserPopup>
                        <div className="truncate">{message.replyTo.text.slice(0, 100)}</div>
                    </span>
                </div>
            )}
            <div className={`flex items-start gap-3 px-4 py-0.5`}>
                <HasUserPopup user={messageUser}>
                    <UserAvatar size="w-10 h-10 relative top-1" displayOnline={false} avatar={messageUser.avatar} icon={messageUser.username.charAt(0).toUpperCase()} />
                </HasUserPopup>
                <div className="flex flex-col">
                    <div className="flex items-start gap-2">
                        <HasUserPopup user={messageUser} >
                            <span className="text-lg mt-0.5 font-bold text-foreground hover:underline">{messageUser.username}</span>
                        </HasUserPopup>
                        <span className="text-sm mt-1 text-muted-foreground">{dateTimeString}</span>
                    </div>
                    <span className={`${message.pending ? 'text-muted-foreground' : 'text-foreground'} whitespace-pre-wrap text-base`}>
                        {message.text}
                        {message.pending && (
                            <span className="text-xs text-foreground ml-1"><FontAwesomeIcon spin={true} icon={faSpinnerThird} /></span>
                        )}
                    </span>
                    <Reactions disabled={disabled} message={message} />
                </div>
                {!disabled && (
                    <MessageActionPopup message={message} />
                )}
            </div>
        </div>
    ) : (
        <div id={`message-${message.id}`} className="relative flex items-start pl-6 pr-4 transition-colors duration-700 hover:bg-muted/50 py-0.5 group">
            <span className="w-11 text-[10px] text-foreground/70 shrink-0 opacity-0 group-hover:opacity-100 relative top-1">{timeString}</span>
            <div className="flex flex-col">
                <span className={`${message.pending ? 'text-foreground animate animate-pulse' : 'text-foreground'} whitespace-pre-wrap text-base flex items-center`}>
                    {message.text}
                        {message.pending && (
                            <span className="text-xs text-foreground ml-1"><FontAwesomeIcon spin={true} icon={faSpinnerThird} /></span>
                        )}
                </span>
                <Reactions disabled={disabled} message={message} />
            </div>
            {!disabled && (
                <MessageActionPopup message={message} />
            )}
        </div>
    );
}
export default MessageItem;