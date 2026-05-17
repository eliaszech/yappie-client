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

function ChannelOverviewSection({ channel, server }) {
    const [name, setName] = useState(channel.name);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const queryClient = useQueryClient();

    const hasChanges = name.trim() !== channel.name;

    function handleReset() {
        setName(channel.name);
        setError('');
    }

    async function handleSave() {
        const trimmed = name.trim();
        if (!trimmed) return;
        setSaving(true);
        setError('');
        const res = await updateChannel(server.id, channel.id, { name: trimmed });
        if (!res.error) {
            queryClient.setQueryData(['channels', server.id], (old) =>
                old ? old.map(c => c.id === res.id ? { ...c, name: trimmed } : c) : old
            );
            queryClient.setQueryData(['channel', res.id], (old) =>
                old ? { ...old, name: trimmed } : old
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
