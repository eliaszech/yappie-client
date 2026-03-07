function FriendItem({user}) {
    return(
        <div
            className="cursor-pointer flex items-center gap-3 px-2 py-3 rounded-md hover:bg-border transition duration-200">
            <div className="relative shrink-0">
                <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-primary-foreground bg-primary">
                    {user.username.charAt(0).toUpperCase()}
                </div>
                <div
                    className={`${user.online ? 'bg-online' : 'bg-offline'} absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background `}></div>
            </div>
            <div className="flex flex-col">
                <span className="text-foreground font-medium">{user.username}</span>
                <span className="text-xs text-foreground/60">{user.online ? 'Online' : 'Offline'}</span>
            </div>
        </div>
    )
}
export default FriendItem;