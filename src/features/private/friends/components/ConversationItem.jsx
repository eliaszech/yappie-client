import UserAvatar from "../../../components/UserAvatar.jsx";
import {useIsOnline} from "../../../../hooks/usePresence.js";
import UserAvatarGroup from "../../../components/UserAvatarGroup.jsx";
import {NavLink} from "react-router-dom";

function ConversationItem({conversation}) {
    const participants = conversation.participants;
    const isSingle = participants.length === 1;
    const conversationTitle = participants.map(participant => participant.user.username).join(', ');

    const isOnline = useIsOnline(participants[0].user.id);
    const online = isOnline !== undefined ? isOnline : participants[0].user.online;

    const icons = participants.map(participant => participant.user.username.charAt(0).toUpperCase());

    return (
        <NavLink to={`/@me/messages/${conversation.id}`} key={conversation.id}
                 className={({isActive}) => `${isActive ? 'bg-muted/50 text-foreground' : 'text-foreground/80'} w-full flex items-center gap-2.5 px-2 py-1 rounded-md font-medium transition-all  hover:text-foreground hover:bg-muted/50`}>
            {isSingle
                ? <UserAvatar online={online} icon={icons[0]}/>
                : <UserAvatarGroup icons={icons} />
            }
            <div className="flex flex-col">
                <span className="text-sm">{conversationTitle}</span>
                {conversation.messages[0] !== undefined ? (
                    <span className="text-muted-foreground text-xs">{conversation.messages[0].text}</span>
                ) : null}

            </div>
        </NavLink>
    )
}

export default ConversationItem;