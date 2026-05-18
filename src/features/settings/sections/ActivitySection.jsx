import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faTrash, faSpinner, faMagnifyingGlass, faXmark } from "@awesome.me/kit-95376d5d61/icons/classic/solid";
import {
    getActivityEnabled, setActivityEnabled,
    getCustomGames, addCustomGame, removeCustomGame,
    subscribe,
} from "../../../services/activitySettings.js";

function Toggle({ value, onChange }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={value}
            onClick={() => onChange(!value)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border border-border transition-colors ${
                value ? 'bg-primary' : 'bg-muted'
            }`}
        >
            <span
                className={`inline-block h-5 w-5 transform rounded-full bg-foreground shadow transition-transform mt-[1px] ${
                    value ? 'translate-x-5' : 'translate-x-[1px]'
                }`}
            />
        </button>
    );
}

function AddGameModal({ onClose, onAdd, existing }) {
    const [loading, setLoading] = useState(true);
    const [processes, setProcesses] = useState([]);
    const [filter, setFilter] = useState('');
    const [error, setError] = useState(null);

    async function refresh() {
        setLoading(true);
        setError(null);
        try {
            const api = window.electronAPI;
            if (!api?.listRunningProcesses) {
                setError('Diese Funktion ist nur in der Desktop-App verfügbar.');
                setProcesses([]);
                return;
            }
            const list = await api.listRunningProcesses();
            const existingSet = new Set(existing.map(g => g.processName));
            setProcesses(list.filter(p => !existingSet.has(p.processName)));
        } catch (err) {
            setError(err?.message || 'Prozesse konnten nicht geladen werden.');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { refresh(); }, []);

    useEffect(() => {
        function onKey(e) { if (e.key === 'Escape') onClose(); }
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose]);

    const lower = filter.trim().toLowerCase();
    const filtered = lower
        ? processes.filter(p =>
            p.displayName.toLowerCase().includes(lower) ||
            p.processName.toLowerCase().includes(lower))
        : processes;

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center">
            <div onClick={onClose} className="absolute inset-0 bg-black/60 cursor-pointer" />
            <div className="relative z-10 bg-background rounded-xl border border-border w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <h2 className="text-base font-semibold text-foreground">Spiel hinzufügen</h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground cursor-pointer">
                        <FontAwesomeIcon icon={faXmark} />
                    </button>
                </div>
                <div className="px-4 py-3 border-b border-border">
                    <div className="relative">
                        <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs" />
                        <input
                            autoFocus
                            value={filter}
                            onChange={e => setFilter(e.target.value)}
                            placeholder="Suchen…"
                            className="w-full pl-9 pr-3 py-2 rounded-md bg-card border border-border text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/60"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                    {loading && (
                        <div className="flex items-center justify-center py-8 text-muted-foreground text-sm gap-2">
                            <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                            Prozesse werden geladen…
                        </div>
                    )}
                    {!loading && error && (
                        <div className="px-3 py-4 text-sm text-red-300">{error}</div>
                    )}
                    {!loading && !error && filtered.length === 0 && (
                        <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                            Keine passenden laufenden Prozesse gefunden. Starte das Spiel und tippe auf "Aktualisieren".
                        </div>
                    )}
                    {!loading && !error && filtered.map(p => (
                        <button
                            key={p.processName}
                            onClick={() => { onAdd(p); onClose(); }}
                            className="w-full flex flex-col items-start px-3 py-2 rounded-md hover:bg-muted text-left cursor-pointer"
                        >
                            <span className="text-sm text-foreground truncate w-full">{p.displayName}</span>
                            <span className="text-[11px] text-muted-foreground truncate w-full">{p.processName}</span>
                        </button>
                    ))}
                </div>
                <div className="px-4 py-3 border-t border-border flex justify-between">
                    <button
                        onClick={refresh}
                        disabled={loading}
                        className="px-3 py-1.5 rounded-md bg-muted text-foreground text-sm hover:bg-muted/70 cursor-pointer disabled:opacity-50"
                    >
                        Aktualisieren
                    </button>
                    <button
                        onClick={onClose}
                        className="px-3 py-1.5 rounded-md text-muted-foreground text-sm hover:text-foreground cursor-pointer"
                    >
                        Abbrechen
                    </button>
                </div>
            </div>
        </div>
    );
}

function ActivitySection() {
    const [enabled, setEnabledState] = useState(getActivityEnabled);
    const [games, setGames] = useState(getCustomGames);
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        return subscribe(() => {
            setEnabledState(getActivityEnabled());
            setGames(getCustomGames());
        });
    }, []);

    function handleToggle(next) {
        setActivityEnabled(next);
    }

    function handleAdd(proc) {
        addCustomGame(proc.processName, proc.displayName);
    }

    function handleRemove(processName) {
        removeCustomGame(processName);
    }

    return (
        <div className="flex flex-col w-full">
            <div className="flex items-center justify-between px-4 py-2">
                <h1 className="text-lg font-bold text-foreground">Aktivität</h1>
            </div>

            <div className="max-w-[70%] py-4 px-4 w-full mx-auto flex flex-col gap-8 overflow-y-auto">
                <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-4">
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground">Aktivitätsstatus teilen</span>
                        <span className="text-xs text-muted-foreground mt-0.5">
                            Wenn aktiviert, sehen andere, welches Spiel du gerade spielst.
                        </span>
                    </div>
                    <Toggle value={enabled} onChange={handleToggle} />
                </div>

                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-8 justify-between">
                        <div className="flex flex-col">
                            <h2 className="text-sm font-semibold text-foreground">Eigene Spiele</h2>
                            <span className="text-xs text-muted-foreground mt-0.5">
                                Yappie erkennt viele Spiele automatisch. Hier kannst du eigene hinzufügen.
                            </span>
                        </div>
                        <button
                            onClick={() => setAdding(true)}
                            disabled={!enabled}
                            className="flex items-center whitespace-nowrap gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/80 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <FontAwesomeIcon icon={faPlus} className="text-xs" />
                            Spiel hinzufügen
                        </button>
                    </div>

                    {games.length === 0 ? (
                        <div className="bg-card border border-border rounded-xl px-4 py-8 text-center text-sm text-muted-foreground">
                            Du hast noch keine eigenen Spiele hinzugefügt.
                        </div>
                    ) : (
                        <div className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
                            {games.map(g => (
                                <div key={g.processName} className="flex items-center justify-between px-4 py-2.5">
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-sm text-foreground truncate">{g.displayName}</span>
                                        <span className="text-[11px] text-muted-foreground truncate">{g.processName}</span>
                                    </div>
                                    <button
                                        onClick={() => handleRemove(g.processName)}
                                        className="text-muted-foreground hover:text-red-400 cursor-pointer px-2 py-1 rounded-md hover:bg-muted"
                                        title="Entfernen"
                                    >
                                        <FontAwesomeIcon icon={faTrash} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {adding && (
                <AddGameModal
                    existing={games}
                    onClose={() => setAdding(false)}
                    onAdd={handleAdd}
                />
            )}
        </div>
    );
}

export default ActivitySection;