import {getSocket} from "../../../services/socket.js";

// `close` is injected by Dropdown via cloneElement so we can dismiss after
// a status is picked. Outside-click handling lives in Dropdown — no need to
// duplicate it here.
function StatusPicker({ close }) {
    const socket = getSocket();

    function setStatus(status) {
        socket.emit('user:setStatus', status);
        close?.();
    }

    const statuses = [
        { key: 'online', label: 'Online', color: 'bg-online' },
        { key: 'idle', label: 'Abwesend', color: 'bg-yellow-400' },
        { key: 'dnd', label: 'Bitte nicht stören', color: 'bg-red-500', description: 'Du erhältst keine Benachrichtigungen' },
        { key: 'invisible', label: 'Unsichtbar', color: 'bg-offline', description: 'Du erscheinst als offline' },
    ];

    return (
        <div className="bg-muted border border-border divide-y divide-card rounded-lg shadow-xl overflow-hidden">
            {statuses.map(s => (
                <button key={s.key}
                        onClick={() => setStatus(s.key)}
                        className="cursor-pointer w-full flex items-center gap-3 px-3 py-2 hover:bg-card/50 text-left"
                >
                    <div className={`w-3 h-3 rounded-full ${s.color}`} />
                    <div>
                        <span className="text-sm text-foreground">{s.label}</span>
                        {s.description && (
                            <p className="text-xs text-muted-foreground">{s.description}</p>
                        )}
                    </div>
                </button>
            ))}
        </div>
    );
}

export default StatusPicker;