import {useIsOnline, useUserStatus} from "../../hooks/usePresence.js";
import UserAvatar from "./UserAvatar.jsx";
import StatusText from "./user/StatusText.jsx";
import {denyFriendRequest, fetchGetOrCreateConversation} from "../../services/api.js";
import {useQueryClient} from "@tanstack/react-query";
import {useNavigate} from "react-router-dom";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faMessage, faUserMinus} from "@awesome.me/kit-95376d5d61/icons/classic/solid";
import {useAuth} from "../../hooks/useAuth.js";
import {getSocket} from "../../services/socket.js";

function UserItem({friend, paddings = 'px-2 py-1'}) {
    const {user} = useAuth();
    const isOnline = useIsOnline(friend.id)
    const online = isOnline !== undefined ? isOnline : friend.online;
    const status = useUserStatus(friend.id) || friend.status;
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    async function openConversation() {
        const res = await fetchGetOrCreateConversation(user.id, friend.id);

        queryClient.invalidateQueries({ queryKey: ['conversations'] });
        navigate(`/@me/messages/${res.id}`);
    }

    async function handleRemoveFriend() {
        const socket = getSocket();
        if (!socket) return;

        const res = await denyFriendRequest(friend.friendId);

        if(res.status !== 400) {
            queryClient.setQueryData(['friends'], (old) => {
                if (!old) return old;

                return old.filter(f => f.friendId !== friend.friendId);
            });

            socket.emit('friend:decline', friend.friendId, friend.id);
        }
    }

    return(
        <div className={`cursor-pointer flex items-center justify-between gap-3 ${paddings} rounded-md hover:bg-border transition duration-200`}>
            <div className="flex items-center gap-3" onClick={() => openConversation()}>
                <UserAvatar icon={friend.username.charAt(0).toUpperCase()} online={online} status={status} />
                <div className="flex flex-col">
                    <span className="text-foreground font-medium">{friend.displayName ?? friend.username}</span>
                    <span className="text-xs text-foreground/60">
                    <StatusText hideBubble={true} hideDescription={true} online={online} userStatus={status} />
                </span>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <button onClick={() => openConversation()} className="cursor-pointer hover:bg-primary/30 text-primary bg-primary/20 px-2 py-1 rounded-lg text-sm">
                    <FontAwesomeIcon icon={faMessage} />
                </button>
                <button onClick={() => handleRemoveFriend()} className="cursor-pointer hover:bg-red-500/30 text-red-400 bg-red-500/20 px-2 py-1 rounded-lg text-sm">
                    <FontAwesomeIcon icon={faUserMinus} />
                </button>
            </div>
        </div>

    )
}

export default UserItem;