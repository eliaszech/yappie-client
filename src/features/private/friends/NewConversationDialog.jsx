import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faMagnifyingGlass, faCheck, faSpinner } from '@awesome.me/kit-95376d5d61/icons/classic/solid';
import { useAuth } from '../../../hooks/useAuth.js';
import {
    fetchFriends,
    fetchOrCreateConversationWith,
    createGroupConversation,
} from '../../../services/api.js';
import UserAvatar from '../../components/UserAvatar.jsx';

function NewConversationDialog({ onClose }) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(() => new Set());
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    const { data: friends = [], isLoading } = useQuery({
        queryKey: ['friends'],
        queryFn: fetchFriends,
        staleTime: 10 * 60 * 1000,
    });

    const acceptedFriends = useMemo(
        () => friends.filter(f => f.friendStatus === 'ACCEPTED'),
        [friends],
    );

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return acceptedFriends;
        return acceptedFriends.filter(f =>
            (f.displayName?.toLowerCase().includes(q)) ||
            f.username.toLowerCase().includes(q)
        );
    }, [acceptedFriends, search]);

    useEffect(() => {
        function onKey(e) { if (e.key === 'Escape') onClose(); }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    function toggle(id) {
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    const selectedFriends = acceptedFriends.filter(f => selected.has(f.id));
    const count = selectedFriends.length;

    let buttonLabel = 'Auswählen';
    if (count === 1) buttonLabel = 'Direktnachricht öffnen';
    else if (count >= 2) buttonLabel = `Gruppen-DM erstellen (${count + 1})`;

    async function handleCreate() {
        if (count === 0 || busy) return;
        setBusy(true);
        setError('');

        if (count === 1) {
            const target = selectedFriends[0];
            const res = await fetchOrCreateConversationWith(target.id);
            if (res?.error) {
                setError(res.error);
                setBusy(false);
                return;
            }
            queryClient.setQueryData(['conversations', user.id], (old) => {
                if (!Array.isArray(old)) return old;
                if (old.some(c => c.id === res.id)) return old;
                return [{ ...res, unreadCount: 0 }, ...old];
            });
            navigate(`/@me/messages/${res.id}`);
            onClose();
            return;
        }

        const ids = selectedFriends.map(f => f.id);
        const res = await createGroupConversation(ids);
        if (res?.error) {
            setError(res.error);
            setBusy(false);
            return;
        }
        queryClient.setQueryData(['conversations', user.id], (old) => {
            if (!Array.isArray(old)) return old;
            if (old.some(c => c.id === res.id)) return old;
            return [{ ...res, unreadCount: 0 }, ...old];
        });
        navigate(`/@me/messages/${res.id}`);
        onClose();
    }

    return (
        <div
            className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div
                className="relative bg-card border border-border rounded-lg shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-start justify-between px-5 pt-5 pb-3">
                    <div>
                        <h2 className="text-lg font-bold text-foreground">Neue Direktnachricht</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Wähle bis zu 9 weitere Freunde für eine Gruppe.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full hover:bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                    >
                        <FontAwesomeIcon icon={faXmark} />
                    </button>
                </div>

                <div className="px-5 pb-3 shrink-0">
                    <div className="relative">
                        <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs" />
                        <input
                            autoFocus
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Freund suchen…"
                            className="w-full pl-9 pr-3 py-2 rounded-md bg-input border border-border text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/60 placeholder:text-muted-foreground!"
                        />
                    </div>

                    {selectedFriends.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                            {selectedFriends.map(f => (
                                <button
                                    key={f.id}
                                    onClick={() => toggle(f.id)}
                                    className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs cursor-pointer hover:bg-primary/25 transition-colors"
                                >
                                    <span className="truncate max-w-[120px]">{f.displayName ?? f.username}</span>
                                    <FontAwesomeIcon icon={faXmark} className="text-[10px]" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto px-2 pb-2">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8 text-muted-foreground text-sm gap-2">
                            <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                            Lädt…
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                            {acceptedFriends.length === 0
                                ? 'Du hast noch keine Freunde.'
                                : 'Keine passenden Freunde gefunden.'}
                        </div>
                    ) : (
                        filtered.map(f => {
                            const isSelected = selected.has(f.id);
                            return (
                                <button
                                    key={f.id}
                                    onClick={() => toggle(f.id)}
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer text-left transition-colors ${
                                        isSelected ? 'bg-primary/10 hover:bg-primary/15' : 'hover:bg-muted/50'
                                    }`}
                                >
                                    <UserAvatar
                                        size="w-9 h-9 text-sm"
                                        onlineSize="w-2.5 h-2.5 bottom-0 right-0"
                                        icon={f.username.charAt(0).toUpperCase()}
                                        avatar={f.avatar}
                                        online={f.online}
                                        status={f.status}
                                    />
                                    <div className="min-w-0 flex-1">
                                        <div className="text-sm font-medium text-foreground truncate">
                                            {f.displayName ?? f.username}
                                        </div>
                                        <div className="text-xs text-muted-foreground truncate">{f.username}</div>
                                    </div>
                                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                                        isSelected ? 'bg-primary border-primary' : 'border-muted-foreground/40'
                                    }`}>
                                        {isSelected && <FontAwesomeIcon icon={faCheck} className="text-white text-[10px]" />}
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>

                {error && (
                    <p className="px-5 pb-2 text-xs text-dnd">{error}</p>
                )}

                <div className="px-5 py-3 border-t border-border flex items-center justify-end gap-2 shrink-0">
                    <button
                        onClick={onClose}
                        className="px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                        Abbrechen
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={count === 0 || busy}
                        className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {busy && <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xs" />}
                        {buttonLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default NewConversationDialog;
