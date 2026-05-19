import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@awesome.me/kit-95376d5d61/icons/classic/solid";
import { updateChannel } from "../../../../services/api.js";
import { useQueryClient } from "@tanstack/react-query";

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

// Whitelist matches the backend. Empty string means "use LiveKit default".
const BITRATE_PRESETS = [
    { value: '',       label: 'Standard (LiveKit-Default)' },
    { value: 32000,    label: 'Sprache · 32 kbps' },
    { value: 64000,    label: 'Hohe Sprachqualität · 64 kbps' },
    { value: 96000,    label: 'Musik · 96 kbps' },
    { value: 128000,   label: 'Musik HD · 128 kbps' },
];

function ChannelOverviewSection({ channel, server }) {
    const [name, setName] = useState(channel.name);
    // Empty string means "no limit". Numeric input is clamped to 1-99 on save.
    const [userLimit, setUserLimit] = useState(channel.userLimit ?? '');
    const [bitrate, setBitrate] = useState(channel.bitrate ?? '');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const queryClient = useQueryClient();

    const isVoice = channel.type === 'voice';
    const limitOnServer = channel.userLimit ?? '';
    const bitrateOnServer = channel.bitrate ?? '';
    const hasChanges = name.trim() !== channel.name
        || (isVoice && String(userLimit) !== String(limitOnServer))
        || (isVoice && String(bitrate) !== String(bitrateOnServer));

    function handleReset() {
        setName(channel.name);
        setUserLimit(channel.userLimit ?? '');
        setBitrate(channel.bitrate ?? '');
        setError('');
    }

    async function handleSave() {
        const trimmed = name.trim();
        if (!trimmed) return;

        const patch = {};
        if (trimmed !== channel.name) patch.name = trimmed;
        if (isVoice && String(userLimit) !== String(limitOnServer)) {
            if (userLimit === '' || userLimit === null) {
                patch.userLimit = null;
            } else {
                const n = Number(userLimit);
                if (!Number.isFinite(n) || n < 1 || n > 99) {
                    setError('Nutzerlimit muss zwischen 1 und 99 liegen.');
                    return;
                }
                patch.userLimit = Math.floor(n);
            }
        }
        if (isVoice && String(bitrate) !== String(bitrateOnServer)) {
            patch.bitrate = bitrate === '' ? null : Number(bitrate);
        }

        setSaving(true);
        setError('');
        const res = await updateChannel(server.id, channel.id, patch);
        if (!res.error) {
            queryClient.setQueryData(['channels', server.id], (old) =>
                old ? old.map(c => c.id === res.id ? { ...c, ...patch } : c) : old
            );
            queryClient.setQueryData(['channel', res.id], (old) =>
                old ? { ...old, ...patch } : old
            );
        } else {
            setError(res.error);
        }
        setSaving(false);
    }

    return (
        <div className="flex flex-col w-full h-full">
            <div className="flex items-center justify-between px-4 py-2">
                <h1 className="text-lg font-bold text-foreground">Übersicht</h1>
            </div>

            <div className="relative max-w-[65%] py-4 px-4 w-full h-full mx-auto flex flex-col gap-4">
                <div className="bg-card rounded-xl border border-border p-5">
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Kanalname
                    </label>
                    <input
                        value={name}
                        onChange={e => setName(e.target.value)}
                        maxLength={64}
                        className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring transition-all"
                    />
                </div>

                <div className="bg-card rounded-xl border border-border p-5">
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Kanaltyp
                    </label>
                    <div className="text-sm text-muted-foreground">
                        {channel.type === 'text' ? 'Textkanal' : 'Sprachkanal'}
                    </div>
                </div>

                {isVoice && (
                    <div className="bg-card rounded-xl border border-border p-5">
                        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                            Nutzerlimit
                        </label>
                        <input
                            type="number"
                            min={1}
                            max={99}
                            placeholder="Kein Limit"
                            value={userLimit}
                            onChange={e => setUserLimit(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring transition-all"
                        />
                        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                            Maximale Anzahl Nutzer im Sprachkanal (1–99). Leer lassen für kein Limit.
                            Moderatoren mit <span className="text-foreground font-medium">Kanäle verwalten</span> können das Limit umgehen.
                        </p>
                    </div>
                )}

                {isVoice && (
                    <div className="bg-card rounded-xl border border-border p-5">
                        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                            Audio-Qualität
                        </label>
                        <select
                            value={bitrate}
                            onChange={e => setBitrate(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring transition-all cursor-pointer"
                        >
                            {BITRATE_PRESETS.map(p => (
                                <option key={String(p.value)} value={p.value}>{p.label}</option>
                            ))}
                        </select>
                        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                            Höhere Bitraten klingen besser, brauchen aber mehr Bandbreite. Nach Speichern
                            müssen verbundene Nutzer den Kanal neu betreten, damit die neue Bitrate aktiv wird.
                        </p>
                    </div>
                )}

                <div className="bg-card rounded-xl border border-border p-5">
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Kanal-ID
                    </label>
                    <div className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-muted-foreground select-all font-mono break-all">
                        {channel.id}
                    </div>
                </div>

                {error && <p className="text-sm text-dnd">{error}</p>}

                <SaveBar visible={hasChanges} onReset={handleReset} onSave={handleSave} saving={saving} />
            </div>
        </div>
    );
}

export default ChannelOverviewSection;
