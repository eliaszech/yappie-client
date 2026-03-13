const statusColors = {
    online: 'bg-online',
    idle: 'bg-yellow-400',
    dnd: 'bg-red-500',
    invisible: 'bg-offline',
    offline: 'bg-offline',
};

function StatusIndicator({ online, userStatus, fallbackOnline, fallbackStatus, size = 'w-3 h-3' }) {
    const status = userStatus || fallbackStatus || (online ? 'online' : 'offline');

    const displayStatus = !online ? 'offline' : status;

    return (
        <div className={`${size} absolute rounded-full border-2 border-card ${statusColors[displayStatus] || statusColors.offline}`}>
            {displayStatus === 'dnd' && (
                <div className="w-full h-full flex items-center justify-center">
                    <div className="w-1.5 h-0.5 bg-card rounded-full" />
                </div>
            )}
        </div>
    );
}

export default StatusIndicator;