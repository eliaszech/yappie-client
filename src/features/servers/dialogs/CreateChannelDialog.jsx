import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHashtag, faVolumeHigh, faXmark } from '@awesome.me/kit-95376d5d61/icons/classic/solid';
import { createChannel } from '../../../services/api.js';
import { useQueryClient } from '@tanstack/react-query';

const TYPES = [
    {
        id: 'text',
        label: 'Textkanal',
        description: 'Schreibe Nachrichten, lade Dateien hoch und teile Links.',
        icon: faHashtag,
    },
    {
        id: 'voice',
        label: 'Sprachkanal',
        description: 'Trete einem Kanal bei, um per Sprache zu kommunizieren.',
        icon: faVolumeHigh,
    },
];

function TypeCard({ type, selected, onSelect }) {
    return (
        <button
            type="button"
            onClick={() => onSelect(type.id)}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg border-2 text-left transition-all cursor-pointer ${
                selected
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-muted-foreground/40 bg-card'
            }`}
        >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                selected ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
            }`}>
                <FontAwesomeIcon icon={type.icon} className="text-base" />
            </div>
            <div className="flex flex-col min-w-0">
                <span className={`font-semibold text-sm ${selected ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {type.label}
                </span>
                <span className="text-xs text-muted-foreground leading-snug">{type.description}</span>
            </div>
            <div className={`ml-auto w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${
                selected ? 'border-primary bg-primary' : 'border-muted-foreground/40'
            }`}>
                {selected && <div className="w-2 h-2 rounded-full bg-primary-foreground" />}
            </div>
        </button>
    );
}

function CreateChannelDialog({ serverId, serverName, initialType = 'text', onClose }) {
    const [channelType, setChannelType] = useState(initialType);
    const [channelName, setChannelName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const queryClient = useQueryClient();

    useEffect(() => {
        const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [onClose]);

    function sanitizeName(value) {
        if(channelType === 'voice') {
            return value;
        } else {
            return value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '');
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        const name = channelName.trim();
        if (!name) {
            setError('Bitte gib einen Kanalnamen ein.');
            return;
        }

        setLoading(true);
        setError('');
        const res = await createChannel(serverId, name, channelType);
        setLoading(false);

        if (res.error) {
            setError(res.error);
            return;
        }

        queryClient.setQueryData(['channels', serverId], (old = []) => [...old, res]);
        onClose();
    }

    const prefix = channelType === 'text' ? <FontAwesomeIcon icon={faHashtag} /> : <FontAwesomeIcon icon={faVolumeHigh} />;

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60" onClick={onClose} />
            <div className="relative bg-background rounded-xl shadow-2xl w-[460px] overflow-hidden">
                {/* Header */}
                <div className="px-6 pt-6 pb-4">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                        <FontAwesomeIcon icon={faXmark} className="text-lg" />
                    </button>
                    <h2 className="text-xl font-bold text-foreground">Kanal erstellen</h2>
                    <p className="text-sm text-muted-foreground mt-1">In <span className="font-semibold text-foreground">{serverName}</span></p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="px-6 flex flex-col gap-4 pb-6">
                        {/* Type selection */}
                        <div>
                            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                Kanaltyp
                            </label>
                            <div className="flex flex-col gap-2">
                                {TYPES.map(type => (
                                    <TypeCard
                                        key={type.id}
                                        type={type}
                                        selected={channelType === type.id}
                                        onSelect={setChannelType}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Name input */}
                        <div>
                            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                Kanalname
                            </label>
                            <div className="flex items-center bg-card border border-border rounded-lg px-3 gap-2 focus-within:ring-2 focus-within:ring-ring transition-all">
                                <span className="text-muted-foreground text-sm shrink-0">{prefix}</span>
                                <input
                                    autoFocus
                                    value={channelName}
                                    onChange={e => setChannelName(sanitizeName(e.target.value))}
                                    placeholder={channelType === 'text' ? 'neuer-kanal' : 'Sprachkanal'}
                                    maxLength={32}
                                    className="flex-1 bg-transparent py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
                                />
                            </div>
                            {error && <p className="text-xs text-dnd mt-1.5">{error}</p>}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 px-6 py-4 bg-card border-t border-border">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-foreground hover:underline cursor-pointer"
                        >
                            Abbrechen
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !channelName.trim()}
                            className="px-5 py-2 text-sm font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                        >
                            {loading ? 'Erstellen…' : 'Kanal erstellen'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CreateChannelDialog;
