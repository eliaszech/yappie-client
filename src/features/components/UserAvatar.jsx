import {useIsOnline, useUserStatus} from "../../hooks/usePresence.js";
import StatusIndicator from "./user/StatusIndicator.jsx";

function UserAvatar({icon, avatar = null, online = false, status = 'invisible', size = 'w-8 h-8', onlineSize = "w-3 h-3 -bottom-0.5 -right-0.5", displayOnline = true}) {
    return (
        <div className="relative shrink-0 w-max">
            { avatar ? (
                <div
                    className={`${size} rounded-full flex items-center justify-center text-sm font-bold text-primary-foreground bg-primary`}>
                    <img src={avatar} alt="avatar" className="w-full h-full object-cover rounded-full"/>
                </div>
            ) : (
                <div
                    className={`${size} rounded-full flex items-center justify-center font-bold text-primary-foreground bg-primary`}>
                    {icon}
                </div>
            )}
            { displayOnline && (
                <StatusIndicator online={online} userStatus={status} size={onlineSize} />
            )}
        </div>
    )
}
export default UserAvatar;