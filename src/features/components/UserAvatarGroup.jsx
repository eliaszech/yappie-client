function UserAvatar({icons = [], size = 'w-5.5 h-5.5'}) {
    return (
        <div className="relative shrink-0 w-8 h-8">
            <div className={`absolute border border-card ${size} rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground bg-primary`}>
                {icons[0]}
            </div>
            <div className={`absolute border border-card ${size} bottom-0 right-0  rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground bg-primary`}>
                {icons[1]}
            </div>
        </div>
    )
}
export default UserAvatar;