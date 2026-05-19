import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark, faMagnifyingGlass } from "@awesome.me/kit-95376d5d61/icons/classic/solid";
import { searchGifs } from "../../../services/api.js";
import Spinner from "../../components/static/Spinner.jsx";

export default function GiphyPicker({ initialQuery = '', onSelect, onClose }) {
    const [query, setQuery] = useState(initialQuery);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const inputRef = useRef(null);
    const debounceRef = useRef(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    useEffect(() => {
        function onKey(e) {
            if (e.key === 'Escape') onClose();
        }
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose]);

    // Debounce the search so each keystroke doesn't hammer the Tenor proxy.
    useEffect(() => {
        clearTimeout(debounceRef.current);
        let cancelled = false;
        setLoading(true);
        debounceRef.current = setTimeout(async () => {
            const res = await searchGifs(query, 24);
            if (cancelled) return;
            setLoading(false);
            if (res?.error) {
                setError(res.error);
                setResults([]);
            } else {
                setError(null);
                setResults(res?.results ?? []);
            }
        }, 250);
        return () => {
            cancelled = true;
            clearTimeout(debounceRef.current);
        };
    }, [query]);

    function handlePick(gif) {
        onSelect(gif);
        onClose();
    }

    return createPortal((
        <div className="fixed inset-0 z-[300] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60" onClick={onClose} />
            <div className="relative bg-background border border-border rounded-xl shadow-2xl w-[36rem] max-w-[92vw] max-h-[80vh] flex flex-col overflow-hidden z-[301]">
                {/* Header */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                    <FontAwesomeIcon icon={faMagnifyingGlass} className="text-muted-foreground" />
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="GIF suchen…"
                        className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
                    />
                    <button
                        onClick={onClose}
                        className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 cursor-pointer"
                    >
                        <FontAwesomeIcon icon={faXmark} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-3 bg-card/30">
                    {loading && results.length === 0 && (
                        <div className="py-12 flex justify-center"><Spinner size="w-6 h-6" /></div>
                    )}
                    {error && (
                        <div className="py-8 text-center text-sm text-muted-foreground">
                            {error}
                        </div>
                    )}
                    {!loading && !error && results.length === 0 && (
                        <div className="py-8 text-center text-sm text-muted-foreground">
                            Keine Ergebnisse.
                        </div>
                    )}
                    {results.length > 0 && (
                        <div className="grid grid-cols-3 gap-2">
                            {results.map(gif => (
                                <button
                                    key={gif.id}
                                    onClick={() => handlePick(gif)}
                                    className="relative aspect-square overflow-hidden rounded-md bg-muted hover:ring-2 hover:ring-primary transition-all cursor-pointer"
                                    title={gif.title}
                                >
                                    <img
                                        src={gif.preview}
                                        alt={gif.title}
                                        loading="lazy"
                                        className="w-full h-full object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="px-4 py-2 border-t border-border text-[11px] text-muted-foreground text-right">
                    powered by Tenor
                </div>
            </div>
        </div>
    ), document.body);
}
