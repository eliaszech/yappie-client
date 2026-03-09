function UserAvatar({icon, avatar = null, online, size = 'w-8 h-8', displayOnline = true}) {
    return (
        <div className="relative shrink-0">
            { avatar ? (
                <div
                    className={`${size} rounded-full flex items-center justify-center text-sm font-bold text-primary-foreground bg-primary`}>
                    <img src={avatar} alt="avatar" className="w-full h-full object-cover rounded-full"/>
                </div>
            ) : (
                <div
                    className={`${size} rounded-full flex items-center justify-center text-sm font-bold text-primary-foreground bg-primary`}>
                    {icon}
                </div>
            )}
            { displayOnline && online !== null && (
                <div className={`${online ? 'bg-online' : 'bg-offline'} absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background`}></div>
            )}
        </div>
    )
}
export default UserAvatar;