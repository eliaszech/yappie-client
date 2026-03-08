function UserAvatar({icon, online, size = 'w-8 h-8'}) {
    return (
        <div className="relative shrink-0">
            <div
                className={`${size} rounded-full flex items-center justify-center text-sm font-bold text-primary-foreground bg-primary`}>
                {icon}
            </div>
            { online !== null && (
                <div className={`${online ? 'bg-online' : 'bg-offline'} absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background`}></div>
            )}
        </div>
    )
}
export default UserAvatar;