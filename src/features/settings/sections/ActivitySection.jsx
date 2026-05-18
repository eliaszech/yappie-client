import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faTrash, faSpinner, faMagnifyingGlass, faXmark, faGamepad } from "@awesome.me/kit-95376d5d61/icons/classic/solid";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
    getActivityEnabled, setActivityEnabled,
    getCustomGames, addCustomGame, removeCustomGame,
    subscribe,
} from "../../../services/activitySettings.js";
import { useAuth } from "../../../hooks/useAuth.js";
import {
    fetchMyActivitySessions,
    deleteActivitySession,
    deleteAllActivitySessions,
} from "../../../services/api.js";

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

function formatDurationMs(ms) {
    if (!Number.isFinite(ms) || ms <= 0) return '0 Min';
    const totalMin = Math.floor(ms / 60_000);
    if (totalMin < 60) return `${totalMin} Min`;
    const hours = Math.floor(totalMin / 60);
    const minutes = totalMin % 60;
    return minutes ? `${hours} Std ${minutes} Min` : `${hours} Std`;
}

function GeneralTab({ enabled, games, onToggle, onAdd, onRemove }) {
    return (
        <div className="flex flex-col gap-8">
            <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-4">
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">Aktivitätsstatus teilen</span>
                    <span className="text-xs text-muted-foreground mt-0.5">
                        Wenn aktiviert, sehen andere, welches Spiel du gerade spielst.
                    </span>
                </div>
                <Toggle value={enabled} onChange={onToggle} />
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
                        onClick={onAdd}
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
                                    onClick={() => onRemove(g.processName)}
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
    );
}

function PrivacyTab() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [confirming, setConfirming] = useState(false);
    const [busy, setBusy] = useState(false);

    const { data: sessions = [], isLoading } = useQuery({
        queryKey: ['my-activity-sessions'],
        queryFn: () => fetchMyActivitySessions(100),
        staleTime: 30 * 1000,
    });

    function invalidateAll() {
        queryClient.invalidateQueries({ queryKey: ['my-activity-sessions'] });
        queryClient.invalidateQueries({ queryKey: ['activity-stats', user.id] });
        queryClient.invalidateQueries({ queryKey: ['friends-activity-feed'] });
    }

    async function handleDeleteOne(id) {
        setBusy(true);
        const res = await deleteActivitySession(id);
        if (!res.error) invalidateAll();
        setBusy(false);
    }

    async function handleDeleteAll() {
        setBusy(true);
        const res = await deleteAllActivitySessions();
        if (!res.error) invalidateAll();
        setConfirming(false);
        setBusy(false);
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-col">
                        <h2 className="text-sm font-semibold text-foreground">Aktivitätsverlauf</h2>
                        <span className="text-xs text-muted-foreground mt-0.5">
                            Yappie speichert deine Spiel-Sessions, damit du deine Spielzeit-Statistiken
                            siehst. Du kannst sie jederzeit löschen – einzeln oder komplett.
                        </span>
                    </div>
                    {sessions.length > 0 && !confirming && (
                        <button
                            onClick={() => setConfirming(true)}
                            disabled={busy}
                            className="flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-md bg-dnd/15 border border-dnd/30 text-dnd text-sm font-medium hover:bg-dnd/25 cursor-pointer disabled:opacity-50"
                        >
                            <FontAwesomeIcon icon={faTrash} className="text-xs" />
                            Alles löschen
                        </button>
                    )}
                </div>
                {confirming && (
                    <div className="mt-4 p-3 rounded-lg bg-dnd/10 border border-dnd/30 flex items-center justify-between gap-3">
                        <span className="text-sm text-foreground">
                            Wirklich den gesamten Aktivitätsverlauf löschen? Diese Aktion ist endgültig.
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                onClick={() => setConfirming(false)}
                                disabled={busy}
                                className="px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground cursor-pointer"
                            >
                                Abbrechen
                            </button>
                            <button
                                onClick={handleDeleteAll}
                                disabled={busy}
                                className="px-3 py-1.5 rounded-md bg-dnd text-white text-sm font-medium hover:bg-dnd/90 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                            >
                                {busy && <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xs" />}
                                Endgültig löschen
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground text-sm gap-2">
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                    Lädt…
                </div>
            ) : sessions.length === 0 ? (
                <div className="bg-card border border-border rounded-xl px-4 py-8 text-center text-sm text-muted-foreground">
                    Noch keine Aktivität aufgezeichnet.
                </div>
            ) : (
                <div className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
                    {sessions.map(s => {
                        const end = s.endedAt ? new Date(s.endedAt).getTime() : Date.now();
                        const duration = end - new Date(s.startedAt).getTime();
                        const startLabel = new Date(s.startedAt).toLocaleString('de-DE', {
                            day: '2-digit', month: '2-digit', year: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                        });
                        return (
                            <div key={s.id} className="flex items-center gap-3 px-4 py-2.5">
                                {s.icon ? (
                                    <img src={s.icon} alt="" className="w-9 h-9 rounded-md object-cover shrink-0" />
                                ) : (
                                    <div className="w-9 h-9 rounded-md bg-primary/20 text-primary flex items-center justify-center shrink-0">
                                        <FontAwesomeIcon icon={faGamepad} />
                                    </div>
                                )}
                                <div className="flex flex-col min-w-0 flex-1">
                                    <span className="text-sm text-foreground truncate">{s.name}</span>
                                    <span className="text-[11px] text-muted-foreground">
                                        {startLabel} · {formatDurationMs(duration)}
                                        {!s.endedAt && <span className="ml-1 text-primary">· läuft</span>}
                                    </span>
                                </div>
                                <button
                                    onClick={() => handleDeleteOne(s.id)}
                                    disabled={busy}
                                    className="text-muted-foreground hover:text-red-400 cursor-pointer px-2 py-1 rounded-md hover:bg-muted disabled:opacity-50"
                                    title="Diesen Eintrag löschen"
                                >
                                    <FontAwesomeIcon icon={faTrash} />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

const TABS = [
    { id: 'general', label: 'Allgemein' },
    { id: 'privacy', label: 'Datenschutz' },
];

function ActivitySection() {
    const [enabled, setEnabledState] = useState(getActivityEnabled);
    const [games, setGames] = useState(getCustomGames);
    const [adding, setAdding] = useState(false);
    const [tab, setTab] = useState('general');

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

            <div className="max-w-[70%] py-4 px-4 w-full mx-auto flex flex-col overflow-y-auto">
                <div className="border-b border-border flex gap-1 mb-6">
                    {TABS.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={`px-3 py-2 text-sm font-medium cursor-pointer transition-colors border-b-2 -mb-px ${
                                tab === t.id
                                    ? 'text-foreground border-primary'
                                    : 'text-muted-foreground border-transparent hover:text-foreground'
                            }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {tab === 'general' && (
                    <GeneralTab
                        enabled={enabled}
                        games={games}
                        onToggle={handleToggle}
                        onAdd={() => setAdding(true)}
                        onRemove={handleRemove}
                    />
                )}

                {tab === 'privacy' && <PrivacyTab />}
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