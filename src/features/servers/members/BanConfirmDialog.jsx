import { useState } from "react";

export default function BanConfirmDialog({ user, onConfirm, onClose }) {
    const [reason, setReason] = useState('');
    const [banning, setBanning] = useState(false);
    const [error, setError] = useState('');

    async function handleConfirm() {
        setBanning(true);
        setError('');
        const err = await onConfirm(reason.trim() || null);
        setBanning(false);
        if (err) {
            setError(err);
            return;
        }
        onClose();
    }

    const name = user.displayName ?? user.username;

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60" onClick={onClose} />
            <div className="relative bg-card border border-border rounded-xl shadow-2xl p-6 w-96 z-[301]">
                <h3 className="text-base font-semibold text-foreground mb-1">Mitglied sperren</h3>
                <p className="text-sm text-muted-foreground mb-4">
                    Möchtest du <span className="font-semibold text-foreground">{name}</span> wirklich sperren?
                    Gesperrte Mitglieder können dem Server nicht mehr beitreten.
                </p>

                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Grund (optional)
                </label>
                <input
                    type="text"
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    placeholder="z.B. Spam, Belästigung..."
                    maxLength={200}
                    className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring transition-all"
                />

                {error && <p className="text-sm text-dnd mt-3">{error}</p>}

                <div className="flex gap-2 justify-end mt-5">
                    <button
                        onClick={onClose}
                        disabled={banning}
                        className="px-4 py-1.5 text-sm rounded-md bg-muted text-foreground hover:bg-muted/80 cursor-pointer transition-colors disabled:opacity-50"
                    >
                        Abbrechen
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={banning}
                        className="px-4 py-1.5 text-sm rounded-md bg-dnd text-white hover:bg-dnd/80 cursor-pointer disabled:opacity-50 transition-colors"
                    >
                        {banning ? '…' : 'Sperren'}
                    </button>
                </div>
            </div>
        </div>
    );
}
