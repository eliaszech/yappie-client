import {useEffect, useRef, useState} from "react";
import {useQuery} from "@tanstack/react-query";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faMagnifyingGlass, faXmark} from "@awesome.me/kit-95376d5d61/icons/classic/solid";
import {searchMessages} from "../../../services/api.js";
import UserAvatar from "../../components/UserAvatar.jsx";
import Spinner from "../../components/static/Spinner.jsx";

function scrollToMessage(messageId) {
    const element = document.getElementById(`message-${messageId}`);
    if (!element) return false;

    element.scrollIntoView({behavior: 'smooth', block: 'center'});
    element.classList.add('bg-primary/10!');
    setTimeout(() => element.classList.remove('bg-primary/10!'), 1500);
    return true;
}

function useDebounced(value, delay = 250) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);
    return debounced;
}

function SearchPopover({type, roomId}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const debouncedQuery = useDebounced(query, 250);
    const ref = useRef(null);
    const inputRef = useRef(null);
    const [hint, setHint] = useState(null);

    useEffect(() => {
        function handleClick(e) {
            if (ref.current && !ref.current.contains(e.target)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    useEffect(() => {
        if (open) {
            setTimeout(() => inputRef.current?.focus(), 50);
        } else {
            setQuery('');
            setHint(null);
        }
    }, [open]);

    useEffect(() => {
        setQuery('');
        setHint(null);
        setOpen(false);
    }, [roomId, type]);

    const trimmed = debouncedQuery.trim();
    const {data: results = [], isFetching} = useQuery({
        queryKey: ['search', type, roomId, trimmed],
        queryFn: () => searchMessages(type, roomId, trimmed),
        enabled: open && trimmed.length >= 2,
        staleTime: 30 * 1000,
    });

    function onResultClick(messageId) {
        const scrolled = scrollToMessage(messageId);
        if (!scrolled) {
            setHint('Nachricht ist außerhalb des geladenen Verlaufs — scrolle nach oben um sie zu finden.');
        } else {
            setOpen(false);
        }
    }

    function highlight(text, q) {
        if (!q) return text;
        const idx = text.toLowerCase().indexOf(q.toLowerCase());
        if (idx === -1) return text;
        return (
            <>
                {text.slice(0, idx)}
                <mark className="bg-primary/30 text-foreground rounded px-0.5">{text.slice(idx, idx + q.length)}</mark>
                {text.slice(idx + q.length)}
            </>
        );
    }

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen(!open)}
                title="Nachrichten suchen"
                className={`flex items-center justify-center w-8 h-8 rounded-md transition-colors cursor-pointer ${open ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
            >
                <FontAwesomeIcon icon={faMagnifyingGlass} />
            </button>
            {open && (
                <div className="absolute z-50 top-full mt-2 right-0 w-[420px] max-h-[520px] bg-card border border-border rounded-lg shadow-xl overflow-hidden flex flex-col">
                    <div className="px-3 py-2.5 border-b border-border shrink-0 flex items-center gap-2">
                        <FontAwesomeIcon icon={faMagnifyingGlass} className="text-muted-foreground text-sm" />
                        <input
                            ref={inputRef}
                            value={query}
                            onChange={(e) => { setQuery(e.target.value); setHint(null); }}
                            placeholder="In diesen Nachrichten suchen..."
                            className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
                        />
                        {query && (
                            <button onClick={() => setQuery('')} className="text-muted-foreground hover:text-foreground cursor-pointer">
                                <FontAwesomeIcon icon={faXmark} className="text-xs" />
                            </button>
                        )}
                    </div>
                    <div className="overflow-y-auto flex-1">
                        {trimmed.length > 0 && trimmed.length < 2 && (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                                Mindestens 2 Zeichen eingeben.
                            </div>
                        )}
                        {isFetching && trimmed.length >= 2 && (
                            <div className="p-4 flex justify-center"><Spinner size="w-6 h-6" /></div>
                        )}
                        {!isFetching && trimmed.length >= 2 && results.length === 0 && (
                            <div className="p-6 text-center text-sm text-muted-foreground">
                                Keine Treffer für „{trimmed}".
                            </div>
                        )}
                        {hint && (
                            <div className="px-4 py-2 text-xs text-muted-foreground bg-muted/40 border-b border-border">
                                {hint}
                            </div>
                        )}
                        {!isFetching && results.map((message) => (
                            <button
                                key={message.id}
                                onClick={() => onResultClick(message.id)}
                                className="w-full text-left px-3 py-2.5 hover:bg-muted/50 border-b border-border last:border-0 transition-colors cursor-pointer"
                            >
                                <div className="flex items-start gap-2.5">
                                    <UserAvatar
                                        size="w-8 h-8 text-xs"
                                        displayOnline={false}
                                        avatar={message.user.avatar}
                                        icon={message.user.username.charAt(0).toUpperCase()}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-sm font-semibold text-foreground truncate">
                                                {message.user.displayName ?? message.user.username}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground shrink-0">
                                                {new Date(message.createdAt).toLocaleDateString('de-DE', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: 'numeric',
                                                })}
                                            </span>
                                        </div>
                                        <div className="text-sm text-foreground/90 break-words line-clamp-3">
                                            {highlight(message.text || '(Anhang)', trimmed)}
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default SearchPopover;
