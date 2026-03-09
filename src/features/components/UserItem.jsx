import {useIsOnline} from "../../hooks/usePresence.js";
import UserAvatar from "./UserAvatar.jsx";

function UserItem({user, paddings = 'px-2 py-1'}) {
    const isOnline = useIsOnline(user.id)
    const online = isOnline !== undefined ? isOnline : user.online;

    return(
        <div className={`cursor-pointer flex items-center gap-3 ${paddings} rounded-md hover:bg-border transition duration-200`}>
            <UserAvatar icon={user.username.charAt(0).toUpperCase()} avatar={user.avatar} online={online} />
            <div className="flex flex-col">
                <span className="text-foreground font-medium">{user.username}</span>
                <span className="text-xs text-foreground/60">{online ? 'Online' : 'Offline'}</span>
            </div>
        </div>
    )
}

export default UserItem;