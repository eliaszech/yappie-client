import {useIsOnline, useUserStatus} from "../../hooks/usePresence.js";
import UserAvatar from "./UserAvatar.jsx";
import StatusText from "./user/StatusText.jsx";

function UserItem({user, paddings = 'px-2 py-1'}) {
    const isOnline = useIsOnline(user.id)
    const online = isOnline !== undefined ? isOnline : user.online;
    const status = useUserStatus(user.id) || user.status;

    return(
        <div className={`cursor-pointer flex items-center gap-3 ${paddings} rounded-md hover:bg-border transition duration-200`}>
            <UserAvatar icon={user.username.charAt(0).toUpperCase()} avatar={user.avatar} online={online} status={status} />
            <div className="flex flex-col">
                <span className="text-foreground font-medium">{user.username}</span>
                <span className="text-xs text-foreground/60">
                    <StatusText hideBubble={true} hideDescription={true} online={online} userStatus={status} />
                </span>
            </div>
        </div>
    )
}

export default UserItem;