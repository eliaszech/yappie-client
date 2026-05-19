import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner, faChevronDown, faUserPlus } from "@awesome.me/kit-95376d5d61/icons/classic/solid";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchChannels, updateServer } from "../../../../services/api.js";

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

export default function SystemMessagesSection({ server }) {
    const queryClient = useQueryClient();
    const [channelId, setChannelId] = useState(server.systemMessagesChannelId ?? '');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const { data: channels = [] } = useQuery({
        queryKey: ['channels', server.id],
        queryFn: () => fetchChannels(server.id),
        staleTime: 10 * 60 * 1000,
    });

    const textChannels = channels.filter(c => c.type === 'text');
    const hasChanges = channelId !== (server.systemMessagesChannelId ?? '');

    function handleReset() {
        setChannelId(server.systemMessagesChannelId ?? '');
        setError('');
    }

    async function handleSave() {
        setSaving(true);
        setError('');
        const res = await updateServer(server.id, {
            systemMessagesChannelId: channelId || null,
        });
        if (!res.error) {
            queryClient.setQueryData(['server', server.id], (old) =>
                old ? { ...old, systemMessagesChannelId: res.systemMessagesChannelId } : old
            );
        } else {
            setError(res.error);
        }
        setSaving(false);
    }

    return (
        <div className="flex flex-col w-full h-full">
            <div className="flex items-center justify-between px-4 py-2">
                <h1 className="text-lg font-bold text-foreground">Systemnachrichten</h1>
            </div>

            <div className="relative max-w-[65%] py-4 px-4 w-full h-full mx-auto flex flex-col gap-4">
                <div className="bg-card rounded-xl border border-border p-5 flex flex-col gap-2">
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Begrüßungskanal
                    </label>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <FontAwesomeIcon icon={faUserPlus} className="text-muted-foreground" />
                        Hier erscheint eine Systemnachricht, wenn ein neues Mitglied dem Server beitritt.
                    </p>
                    <div className="relative mt-2">
                        <select
                            value={channelId}
                            onChange={(e) => setChannelId(e.target.value)}
                            className="w-full appearance-none bg-input border border-border rounded-lg px-3 py-2 pr-9 text-sm text-foreground cursor-pointer hover:border-muted-foreground/50 transition-colors"
                        >
                            <option value="">Keine Begrüßungsnachrichten</option>
                            {textChannels.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
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
