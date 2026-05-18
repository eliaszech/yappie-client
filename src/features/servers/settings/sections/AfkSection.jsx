import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner, faMoon, faChevronDown } from "@awesome.me/kit-95376d5d61/icons/classic/solid";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchChannels, updateServer } from "../../../../services/api.js";

const TIMEOUT_OPTIONS = [
    { value: 60,   label: '1 Minute' },
    { value: 300,  label: '5 Minuten' },
    { value: 600,  label: '10 Minuten' },
    { value: 900,  label: '15 Minuten' },
    { value: 1800, label: '30 Minuten' },
    { value: 3600, label: '1 Stunde' },
];

function SaveBar({ visible, onReset, onSave, saving }) {
    if (!visible) return null;
    return (
        <div className="absolute left-0 bottom-6 w-full z-10 flex justify-between items-center gap-4 bg-card border border-border rounded-xl px-5 py-3 shadow-2xl">
            <span className="text-sm text-muted-foreground">Du hast nicht gespeicherte Änderungen</span>
            <div className="flex items-center gap-4">
                <button onClick={onReset} className="text-sm text-foreground hover:underline cursor-pointer">
                    Zurücksetzen
                </button>
                <button
                    onClick={onSave}
                    disabled={saving}
                    className="bg-primary text-primary-foreground text-sm font-medium px-4 py-1.5 rounded-lg hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50"
                >
                    {saving ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Speichern'}
                </button>
            </div>
        </div>
    );
}

export default function AfkSection({ server }) {
    const queryClient = useQueryClient();
    const [channelId, setChannelId] = useState(server.afkChannelId ?? '');
    const [timeout, setTimeoutValue] = useState(server.afkTimeout ?? 300);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const { data: channels = [] } = useQuery({
        queryKey: ['channels', server.id],
        queryFn: () => fetchChannels(server.id),
        staleTime: 10 * 60 * 1000,
    });

    const voiceChannels = channels.filter(c => c.type === 'voice');

    const hasChanges = channelId !== (server.afkChannelId ?? '') || timeout !== (server.afkTimeout ?? 300);

    function handleReset() {
        setChannelId(server.afkChannelId ?? '');
        setTimeoutValue(server.afkTimeout ?? 300);
        setError('');
    }

    async function handleSave() {
        setSaving(true);
        setError('');
        const res = await updateServer(server.id, {
            afkChannelId: channelId || null,
            afkTimeout: timeout,
        });
        if (!res.error) {
            queryClient.setQueryData(['server', server.id], (old) =>
                old ? { ...old, afkChannelId: res.afkChannelId, afkTimeout: res.afkTimeout } : old
            );
        } else {
            setError(res.error);
        }
        setSaving(false);
    }

    return (
        <div className="flex flex-col w-full h-full">
            <div className="flex items-center justify-between px-4 py-2">
                <h1 className="text-lg font-bold text-foreground">AFK</h1>
            </div>

            <div className="relative max-w-[65%] py-4 px-4 w-full h-full mx-auto flex flex-col gap-4">
                <div className="bg-card rounded-xl border border-border p-5 flex flex-col gap-2">
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        AFK-Kanal
                    </label>
                    <p className="text-sm text-muted-foreground">
                        Inaktive Mitglieder werden in diesen Sprachkanal verschoben. Im AFK-Kanal ist das Mikro automatisch gesperrt.
                    </p>
                    <div className="relative mt-2">
                        <select
                            value={channelId}
                            onChange={(e) => setChannelId(e.target.value)}
                            className="w-full appearance-none bg-input border border-border rounded-lg px-3 py-2 pr-9 text-sm text-foreground cursor-pointer hover:border-muted-foreground/50 transition-colors"
                        >
                            <option value="">Kein AFK-Kanal</option>
                            {voiceChannels.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                        <FontAwesomeIcon
                            icon={faChevronDown}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none text-xs"
                        />
                    </div>
                </div>

                <div className="bg-card rounded-xl border border-border p-5 flex flex-col gap-2">
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Timeout bis Verschiebung
                    </label>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <FontAwesomeIcon icon={faMoon} className="text-muted-foreground" />
                        Nach dieser Inaktivitätsdauer (kein Tippen, keine Mausbewegung).
                    </p>
                    <div className="relative mt-2">
                        <select
                            value={timeout}
                            onChange={(e) => setTimeoutValue(Number(e.target.value))}
                            disabled={!channelId}
                            className="w-full appearance-none bg-input border border-border rounded-lg px-3 py-2 pr-9 text-sm text-foreground cursor-pointer hover:border-muted-foreground/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {TIMEOUT_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                        <FontAwesomeIcon
                            icon={faChevronDown}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none text-xs"
                        />
                    </div>
                </div>

                {error && <p className="text-sm text-dnd">{error}</p>}

                <SaveBar visible={hasChanges} onReset={handleReset} onSave={handleSave} saving={saving} />
            </div>
        </div>
    );
}
