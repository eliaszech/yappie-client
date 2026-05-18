import UserAvatar from "../../../components/UserAvatar.jsx";
import {useIsOnline, useUserStatus} from "../../../../hooks/usePresence.js";
import UserAvatarGroup from "../../../components/UserAvatarGroup.jsx";
import {NavLink, useMatch, useNavigate} from "react-router-dom";
import {useAuth} from "../../../../hooks/useAuth.js";
import {useConversationUnread} from "../../../../hooks/useReadStates.js";
import {useQueryClient} from "@tanstack/react-query";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faXmark} from "@awesome.me/kit-95376d5d61/icons/classic/solid";
import {hideConversation} from "../../../../services/api.js";

function ConversationItem({conversation}) {
    const {user} = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const isActiveRoute = !!useMatch(`/@me/messages/${conversation.id}`);

    const otherUsers = conversation.participants.filter(participant => participant.user.id !== user.id);
    const isSingle = otherUsers.length === 1;
    const conversationTitle = otherUsers.map(participant => participant.user.displayName ?? participant.user.username).join(', ');

    const online = useIsOnline(otherUsers[0].user.id) || otherUsers[0].user.online;
    const status = useUserStatus(otherUsers[0].user.id) || otherUsers[0].user.status;

    const icons = otherUsers.map(participant => participant.user.username.charAt(0).toUpperCase());
    const avatars = otherUsers.map(participant => participant.user.avatar);

    const { unreadCount: liveUnread } = useConversationUnread(conversation.id);
    const unreadCount = liveUnread || conversation.unreadCount || 0;
    const hasUnread = unreadCount > 0;
    const badge = unreadCount > 99 ? '99+' : unreadCount;

    async function handleClose(e) {
        e.preventDefault();
        e.stopPropagation();

        queryClient.setQueryData(['conversations', user.id], (old) => {
            if (!Array.isArray(old)) return old;
            return old.filter((c) => c.id !== conversation.id);
        });

        if (isActiveRoute) navigate('/@me/friends');

        await hideConversation(conversation.id);
    }

    return (
        <NavLink to={`/@me/messages/${conversation.id}`} key={conversation.id}
                 className={({isActive}) => `${isActive ? 'bg-muted/50 text-foreground' : hasUnread ? 'text-foreground' : 'text-foreground/80'} group/conv relative w-full flex items-center px-2 py-1 rounded-md font-medium transition-all justify-between hover:text-foreground hover:bg-muted/50`}>
            {hasUnread && (
                <span className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-2 rounded-r-full bg-foreground" />
            )}
            <div className="flex items-center gap-2.5 min-w-0" >
                {isSingle
                    ? <UserAvatar online={online} status={status} avatar={otherUsers[0].user.avatar} icon={icons[0]}/>
                    : <UserAvatarGroup avatars={avatars} icons={icons} />
                }
                <div className="flex flex-col min-w-0">
                    <span className={`text-sm truncate ${hasUnread ? 'font-semibold' : ''}`}>{conversationTitle}</span>
                    {!isSingle ? (
                        <span className="text-muted-foreground text-xs">{conversation.participants.length} Members</span>
                    ) : (
                        <span className="text-muted-foreground text-xs truncate">{conversation.messages.length > 0 ?
                            `${(conversation.messages[0].user.id === user.id ? 'Du: ' : conversation.messages[0].user.username + ':')} ${conversation.messages[0].text.slice(0, 20)}` :
                            ''
                        }</span>
                    )}
                </div>
            </div>
            <div className="ml-auto pl-2 flex items-center">
                {hasUnread && (
                    <span className="group-hover/conv:hidden min-w-[18px] h-[18px] px-1 rounded-full bg-dnd text-white text-[10px] font-bold flex items-center justify-center">
                        {badge}
                    </span>
                )}
                <button
                    onClick={handleClose}
                    title="Schließen"
                    className="hidden group-hover/conv:flex items-center justify-center w-5 h-5 rounded text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                >
                    <FontAwesomeIcon icon={faXmark} className="text-xs" />
                </button>
            </div>
        </NavLink>
    )
}

export default ConversationItem;