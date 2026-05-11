import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@awesome.me/kit-95376d5d61/icons/classic/solid";
import { updateServer } from "../../../../services/api.js";
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

function OverviewSection({ server }) {
    const [name, setName] = useState(server.name);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const queryClient = useQueryClient();

    const hasChanges = name.trim() !== server.name;

    function handleReset() {
        setName(server.name);
        setError('');
    }

    async function handleSave() {
        const trimmed = name.trim();
        if (!trimmed) return;
        setSaving(true);
        setError('');
        const res = await updateServer(server.id, { name: trimmed });
        if (!res.error) {
            queryClient.setQueryData(['server', server.id], (old) => old ? { ...old, name: trimmed } : old);
            queryClient.setQueryData(['servers'], (old) => {
                if (!old) return old;
                return old.map(s => s.id === server.id ? { ...s, name: trimmed } : s);
            });
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
                {/* Preview card */}
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                    <div className="h-16 bg-primary" />
                    <div className="px-5 pb-5">
                        <div className="-mt-8 mb-3">
                            <div className="w-16 h-16 rounded-full border-4 border-card bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold select-none">
                                {(name || server.name).charAt(0).toUpperCase()}
                            </div>
                        </div>
                        <div className="text-lg font-bold text-foreground">{name || server.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                            Erstellt am {new Date(server.createdAt).toLocaleDateString('de-DE', {
                                day: '2-digit', month: 'long', year: 'numeric'
                            })}
                        </div>
                    </div>
                </div>

                {/* Name input */}
                <div className="bg-card rounded-xl border border-border p-5">
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Servername
                    </label>
                    <input
                        value={name}
                        onChange={e => setName(e.target.value)}
                        maxLength={64}
                        className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring transition-all"
                    />
                </div>

                {/* Server ID */}
                <div className="bg-card rounded-xl border border-border p-5">
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Server-ID
                    </label>
                    <div className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-muted-foreground select-all font-mono break-all">
                        {server.id}
                    </div>
                </div>

                {error && <p className="text-sm text-dnd">{error}</p>}

                <SaveBar visible={hasChanges} onReset={handleReset} onSave={handleSave} saving={saving} />
            </div>
        </div>
    );
}

export default OverviewSection;
