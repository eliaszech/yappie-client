import UserAvatar from "../../../components/UserAvatar.jsx";
import {useIsOnline, useUserStatus} from "../../../../hooks/usePresence.js";
import UserAvatarGroup from "../../../components/UserAvatarGroup.jsx";
import {NavLink} from "react-router-dom";
import {useAuth} from "../../../../hooks/useAuth.js";

function ConversationItem({conversation}) {
    const {user} = useAuth();

    const otherUsers = conversation.participants.filter(participant => participant.user.id !== user.id);
    const isSingle = otherUsers.length === 1;
    const conversationTitle = otherUsers.map(participant => participant.user.username).join(', ');

    const online = useIsOnline(otherUsers[0].user.id) || otherUsers[0].user.online;
    const status = useUserStatus(otherUsers[0].user.id) || otherUsers[0].user.status;

    const icons = otherUsers.map(participant => participant.user.username.charAt(0).toUpperCase());
    const avatars = otherUsers.map(participant => participant.user.avatar);

    return (
        <NavLink to={`/@me/messages/${conversation.id}`} key={conversation.id}
                 className={({isActive}) => `${isActive ? 'bg-muted/50 text-foreground' : 'text-foreground/80'} w-full flex items-center px-2 py-1 rounded-md font-medium transition-all justify-between hover:text-foreground hover:bg-muted/50`}>
            <div className="flex items-center gap-2.5" >
                {isSingle
                    ? <UserAvatar avatar={otherUsers[0].user.avatar} online={online} status={status} icon={icons[0]}/>
                    : <UserAvatarGroup avatars={avatars} icons={icons} />
                }
                <div className="flex flex-col">
                    <span className="text-sm">{conversationTitle}</span>
                    {!isSingle ? (
                        <span className="text-muted-foreground text-xs">{conversation.participants.length} Members</span>
                    ) : (
                        <span className="text-muted-foreground text-xs">{conversation.messages.length > 0 ?
                            `${(conversation.messages[0].user.id === user.id ? 'Du: ' : conversation.messages[0].user.username + ':')} ${conversation.messages[0].text.slice(0, 20)}` :
                            ''
                        }</span>
                    )}
                </div>
            </div>
            { conversation.unreadCount > 0 && (
                <span className="text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5">{conversation.unreadCount}</span>
            )}
        </NavLink>
    )
}

export default ConversationItem;