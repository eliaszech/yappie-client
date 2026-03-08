import UserAvatar from "../../../components/UserAvatar.jsx";

function FriendItem({user}) {
    return(
        <div
            className="cursor-pointer flex items-center gap-3 px-2 py-3 rounded-md hover:bg-border transition duration-200">
            <UserAvatar icon={user.username.charAt(0).toUpperCase()} online={user.online} />
            <div className="flex flex-col">
                <span className="text-foreground font-medium">{user.username}</span>
                <span className="text-xs text-foreground/60">{user.online ? 'Online' : 'Offline'}</span>
            </div>
        </div>
    )
}
export default FriendItem;