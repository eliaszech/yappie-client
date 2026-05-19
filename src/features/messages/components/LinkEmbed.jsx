import { useState, useEffect } from "react";
import { fetchOgMeta } from "../../../services/api.js";

const IMAGE_EXT_REGEX = /\.(jpg|jpeg|png|gif|webp|avif)(\?[^\s]*)?$/i;
const VIDEO_EXT_REGEX = /\.(mp4|webm|mov|ogv)(\?[^\s]*)?$/i;
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

// True for URLs that render purely as media (image, GIF, video, YouTube
// thumbnail/player). MessageItem uses this to suppress the raw URL text when
// the entire message body is just one of these — the embed alone is enough.
export function isPureMediaUrl(url) {
    if (!url) return false;
    if (extractYouTubeId(url)) return true;
    const clean = url.split('?')[0];
    return IMAGE_EXT_REGEX.test(clean) || VIDEO_EXT_REGEX.test(clean);
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
    const [failed, setFailed] = useState(false);
    if (failed) return <OGFallback url={url} />;
    return (
        <div className="mt-2">
            <img
                src={url}
                alt=""
                loading="lazy"
                className="max-w-xs max-h-72 rounded-xl object-contain cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => window.open(url, '_blank')}
                onError={() => setFailed(true)}
            />
        </div>
    );
}

function VideoEmbed({ url }) {
    const [failed, setFailed] = useState(false);
    if (failed) return <OGFallback url={url} />;
    return (
        <div className="mt-2">
            <video
                src={url}
                controls
                preload="metadata"
                className="max-w-sm max-h-80 rounded-xl bg-black"
                onError={() => setFailed(true)}
            />
        </div>
    );
}

// Spotify's own embed iframe. Compact heights for tracks/episodes, taller
// for collections so the album/playlist art reads.
function SpotifyEmbed({ meta }) {
    const tall = meta.spotifyType === 'album' || meta.spotifyType === 'playlist' || meta.spotifyType === 'show';
    return (
        <div className="mt-2 rounded-xl overflow-hidden" style={{ maxWidth: 420 }}>
            <iframe
                src={meta.embed}
                width="100%"
                height={tall ? 352 : 152}
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                style={{ border: 0, borderRadius: 12 }}
            />
        </div>
    );
}

// GitHub repo card. Uses the live data from api.github.com (stars, language,
// description, owner avatar) so it looks meaningfully better than a generic
// OG-card with just the repo's social preview.
function GitHubRepoEmbed({ meta }) {
    return (
        <a
            href={meta.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 flex gap-3 rounded-r-lg border-l-4 border-l-foreground/60 border border-border bg-card p-3 hover:bg-muted/30 transition-colors"
            style={{ maxWidth: 420 }}
            onClick={e => e.stopPropagation()}
        >
            {meta.ownerAvatar && (
                <img
                    src={meta.ownerAvatar}
                    alt=""
                    className="w-10 h-10 rounded-md shrink-0"
                    onError={e => { e.currentTarget.style.display = 'none'; }}
                />
            )}
            <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                <span className="text-xs text-muted-foreground">GitHub</span>
                <span className="text-sm font-semibold text-foreground leading-snug truncate">{meta.fullName}</span>
                {meta.description && (
                    <span className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{meta.description}</span>
                )}
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1">
                    {meta.language && (
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                            {meta.language}
                        </span>
                    )}
                    {typeof meta.stars === 'number' && (
                        <span>★ {meta.stars.toLocaleString('de-DE')}</span>
                    )}
                    {typeof meta.forks === 'number' && meta.forks > 0 && (
                        <span>⑂ {meta.forks.toLocaleString('de-DE')}</span>
                    )}
                </div>
            </div>
        </a>
    );
}

function OGSkeleton() {
    return (
        <div
            className="mt-2 flex gap-3 rounded-r-lg border-l-4 border-l-primary/40 border border-border bg-card/60 p-3 animate-pulse"
            style={{ maxWidth: 420 }}
        >
            <div className="flex flex-col gap-2 min-w-0 flex-1">
                <div className="h-3 w-20 rounded bg-muted" />
                <div className="h-4 w-3/4 rounded bg-muted" />
                <div className="h-3 w-full rounded bg-muted" />
            </div>
            <div className="w-20 h-16 rounded-lg bg-muted flex-shrink-0" />
        </div>
    );
}

// Minimal fallback when OG data can't be fetched (Cloudflare-blocked sites,
// dead links, etc.) — still gives the user a clickable card with hostname +
// favicon so it's clear something *is* linked, instead of an empty void.
function OGFallback({ url }) {
    let hostname = url;
    try { hostname = new URL(url).hostname.replace(/^www\./, ''); } catch { /* ignore */ }
    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 flex items-center gap-2 rounded-r-lg border-l-4 border-l-muted-foreground/40 border border-border bg-card p-2.5 hover:bg-muted/30 transition-colors"
            style={{ maxWidth: 420 }}
            onClick={e => e.stopPropagation()}
        >
            <img
                src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=32`}
                alt=""
                className="w-5 h-5 rounded shrink-0"
                onError={e => { e.currentTarget.style.display = 'none'; }}
            />
            <span className="text-sm text-foreground/80 truncate">{hostname}</span>
        </a>
    );
}

function OGEmbed({ url }) {
    // `undefined` = still loading; `null` = fetch returned no useful data.
    const [meta, setMeta] = useState(metaCache.has(url) ? metaCache.get(url) : undefined);

    useEffect(() => {
        if (meta !== undefined) return;
        let cancelled = false;

        fetchOgMeta(url)
            .then((res) => {
                if (cancelled) return;
                const result = res?.status === 'success' ? res.data : null;
                // Only cache positive results — the backend already negative-
                // caches failures for 5 min, so re-trying a failed URL when
                // the chat re-renders later is cheap and self-healing.
                if (result) metaCache.set(url, result);
                setMeta(result);
            })
            .catch(() => {
                if (!cancelled) setMeta(null);
            });

        return () => { cancelled = true; };
    }, [url, meta]);

    if (meta === undefined) return <OGSkeleton />;
    if (!meta) return <OGFallback url={url} />;

    // Platform-specific renderers (richer than the generic OG card).
    if (meta.type === 'spotify') return <SpotifyEmbed meta={meta} />;
    if (meta.type === 'github')  return <GitHubRepoEmbed meta={meta} />;

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
    if (VIDEO_EXT_REGEX.test(cleanUrl)) return <VideoEmbed url={url} />;

    return <OGEmbed url={url} />;
}

export default LinkEmbed;
