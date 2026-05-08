import { useState, useEffect } from "react";

const IMAGE_EXT_REGEX = /\.(jpg|jpeg|png|gif|webp|avif)(\?[^\s]*)?$/i;
const YOUTUBE_REGEX = /(?:youtube\.com\/watch\?(?:[^&\s]*&)*v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/;
const URL_REGEX = /https?:\/\/[^\s<>"[\]{}|\\^`]+/;

const metaCache = new Map();

function extractYouTubeId(url) {
    const m = url.match(YOUTUBE_REGEX);
    return m ? m[1] : null;
}

export function extractFirstUrl(text) {
    const m = text.match(URL_REGEX);
    return m ? m[0] : null;
}

function YouTubeEmbed({ videoId }) {
    const [playing, setPlaying] = useState(false);

    return (
        <div className="mt-2 rounded-xl overflow-hidden bg-black" style={{ maxWidth: 400, aspectRatio: '16/9', display: 'flex' }}>
            {playing ? (
                <iframe
                    src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                    className="w-full h-full"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    allowFullScreen
                />
            ) : (
                <div className="relative w-full cursor-pointer group/yt" onClick={() => setPlaying(true)}>
                    <img
                        src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                        alt="YouTube Vorschau"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover/yt:bg-black/10 transition-colors">
                        <div className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center shadow-xl transition-transform group-hover/yt:scale-110">
                            <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6 ml-1">
                                <polygon points="5,3 19,12 5,21" />
                            </svg>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function ImageEmbed({ url }) {
    return (
        <div className="mt-2">
            <img
                src={url}
                alt=""
                className="max-w-xs max-h-72 rounded-xl object-contain cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => window.open(url, '_blank')}
                onError={e => { e.currentTarget.parentElement.style.display = 'none'; }}
            />
        </div>
    );
}

function OGEmbed({ url }) {
    const [meta, setMeta] = useState(metaCache.has(url) ? metaCache.get(url) : undefined);

    useEffect(() => {
        if (meta !== undefined) return;
        let cancelled = false;

        fetch(`https://api.microlink.io?url=${encodeURIComponent(url)}`)
            .then(r => r.json())
            .then(({ status, data }) => {
                if (cancelled) return;
                const result = status === 'success' ? data : null;
                metaCache.set(url, result);
                setMeta(result);
            })
            .catch(() => {
                if (!cancelled) {
                    metaCache.set(url, null);
                    setMeta(null);
                }
            });

        return () => { cancelled = true; };
    }, [url, meta]);

    if (!meta) return null;

    let hostname = url;
    try { hostname = new URL(url).hostname.replace(/^www\./, ''); } catch { /* ignore */ }

    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 flex gap-3 rounded-r-lg border-l-4 border-l-primary border border-border bg-card p-3 hover:bg-muted/30 transition-colors"
            style={{ maxWidth: 420 }}
            onClick={e => e.stopPropagation()}
        >
            <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                <span className="text-xs text-primary font-medium">{hostname}</span>
                {meta.title && (
                    <span className="text-sm font-semibold text-foreground leading-snug line-clamp-1">{meta.title}</span>
                )}
                {meta.description && (
                    <span className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{meta.description}</span>
                )}
            </div>
            {meta.image?.url && (
                <img
                    src={meta.image.url}
                    alt=""
                    className="w-20 h-16 rounded-lg object-cover flex-shrink-0"
                    onError={e => { e.currentTarget.style.display = 'none'; }}
                />
            )}
        </a>
    );
}

function LinkEmbed({ url }) {
    const ytId = extractYouTubeId(url);
    if (ytId) return <YouTubeEmbed videoId={ytId} />;

    const cleanUrl = url.split('?')[0];
    if (IMAGE_EXT_REGEX.test(cleanUrl)) return <ImageEmbed url={url} />;

    return <OGEmbed url={url} />;
}

export default LinkEmbed;
