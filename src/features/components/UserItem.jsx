import {useIsOnline, useUserStatus} from "../../hooks/usePresence.js";
import {useUserActivity} from "../../hooks/useActivity.js";
import UserAvatar from "./UserAvatar.jsx";
import StatusText from "./user/StatusText.jsx";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGamepad } from '@awesome.me/kit-95376d5d61/icons/classic/solid';

function UserItem({user, serverMember = null, color = '', paddings = 'px-2 py-1'}) {
    user = serverMember?.user ?? user;
    const isOnline = useIsOnline(user.id)
    const online = isOnline !== undefined ? isOnline : user.online;
    const status = useUserStatus(user.id) || user.status;
    const activity = useUserActivity(user.id);
    const showActivity = online && activity?.name;

    const subline = showActivity ? (
        <span className="flex items-center gap-1 text-xs text-foreground/70 truncate" title={`Spielt ${activity.name}`}>
            <FontAwesomeIcon icon={faGamepad} className="text-[10px] shrink-0" />
            <span className="truncate">{activity.name}</span>
        </span>
    ) : (
        <span className="text-xs text-foreground/60">
            <StatusText hideBubble={true} hideDescription={true} online={online} userStatus={status} />
        </span>
    );

    return (
        <div className={`cursor-pointer flex items-center gap-3 ${paddings} rounded-md hover:bg-border transition duration-200`}>
            <UserAvatar icon={user.username.charAt(0).toUpperCase()} avatar={user.avatar} online={online} status={status} />
            <div className="flex flex-col min-w-0">
                <span className="text-foreground font-medium truncate" style={serverMember ? {color: color} : undefined}>{user.displayName ?? user.username}</span>
                {subline}
            </div>
        </div>
    );
}

export default UserItem;