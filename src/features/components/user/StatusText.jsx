const statuses = [
    { key: 'online', label: 'Online', color: 'bg-online' },
    { key: 'offline', label: 'Offline', color: 'bg-online' },
    { key: 'idle', label: 'Abwesend', color: 'bg-yellow-400' },
    { key: 'dnd', label: 'Bitte nicht stören', color: 'bg-red-500', description: 'Du erhältst keine Benachrichtigungen' },
    { key: 'invisible', label: 'Unsichtbar', color: 'bg-offline', description: 'Du erscheinst als offline' },
];

function StatusIndicator({ online, userStatus, hideBubble = false, hideDescription = false, showRealStatus = false }) {
    const status = userStatus || (online ? 'online' : 'offline');
    const displayStatus = showRealStatus ? status : (!online ? 'offline' : status);

    return (
        <div className="flex items-center gap-4">
            {!hideBubble && (
                <div className={`w-3 h-3 rounded-full ${statuses.find(s => s.key === displayStatus)?.color}`} />
            )}
            <div className="flex flex-col">
                { statuses.find(s => s.key === displayStatus)?.label }
                {!hideDescription && (
                    <div className="text-muted-foreground text-xs">
                        { statuses.find(s => s.key === displayStatus)?.description }
                    </div>
                )}
            </div>

        </div>
    );
}

export default StatusIndicator;