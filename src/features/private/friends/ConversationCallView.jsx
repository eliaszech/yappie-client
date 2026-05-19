import { useEffect, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faMicrophone, faMicrophoneSlash, faHeadphones, faHeadphonesSlash,
    faDisplay, faDisplaySlash, faArrowsRotate, faPlay, faXmark, faMessage,
} from "@awesome.me/kit-95376d5d61/icons/classic/light";
import { faPhone } from "@awesome.me/kit-95376d5d61/icons/classic/solid";
import UserAvatar from "../../components/UserAvatar.jsx";
import VoiceVideoTile from "../../components/VoiceVideoTile.jsx";
import { useVoice } from "../../../hooks/useVoice.jsx";
import { useAuth } from "../../../hooks/useAuth.js";
import { useConversationCall } from "../../../hooks/useConversationCall.js";

function useCallDuration(startedAt) {
    const [now, setNow] = useState(Date.now());
    useEffect(() => {
        if (!startedAt) return;
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, [startedAt]);
    if (!startedAt) return '00:00';
    const sec = Math.max(0, Math.round((now - startedAt) / 1000));
    return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
}

function ParticipantTile({ participant, avatar, avatarSize = 'w-20 h-20' }) {
    const name = participant.displayName ?? participant.name ?? participant.identity;
    return (
        <div className={`group relative flex flex-col items-center justify-center w-full h-full rounded-xl overflow-hidden bg-gradient-to-br from-card to-card/60 ring-2 transition-all ${
            participant.isSpeaking ? 'ring-primary shadow-[0_0_24px_-4px_rgba(88,101,242,0.5)]' : 'ring-transparent'
        }`}>
            {participant.isScreenSharing && (
                <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-green-500/20 text-green-300 text-[11px] font-medium backdrop-blur-sm">
                    <FontAwesomeIcon icon={faDisplay} />
                    <span>Live</span>
                </div>
            )}
            <UserAvatar
                icon={(name || '?').charAt(0).toUpperCase()}
                avatar={avatar}
                displayOnline={false}
                size={avatarSize}
            />
            <div className="absolute bottom-0 left-0 right-0 flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-t from-black/70 to-transparent">
                <span className="text-foreground text-sm font-medium truncate flex-1">{name}</span>
                {participant.isMuted && (
                    <FontAwesomeIcon icon={faMicrophoneSlash} className="text-red-400 text-xs shrink-0" />
                )}
                {participant.isDeafened && (
                    <FontAwesomeIcon icon={faHeadphonesSlash} className="text-red-400 text-xs shrink-0" />
                )}
            </div>
        </div>
    );
}

function ConnectingTile({ user, avatarSize = 'w-20 h-20' }) {
    const name = user.displayName ?? user.username;
    return (
        <div className="relative flex flex-col items-center justify-center w-full h-full rounded-xl overflow-hidden bg-gradient-to-br from-card to-card/60 ring-2 ring-transparent">
            <div className="relative">
                <UserAvatar icon={name.charAt(0).toUpperCase()} avatar={user.avatar} displayOnline={false} size={avatarSize} />
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                    <FontAwesomeIcon icon={faArrowsRotate} className="animate-spin text-white text-xl" />
                </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 flex items-center gap-2 px-2.5 py-1.5 bg-gradient-to-t from-black/70 to-transparent">
                <span className="text-foreground text-sm font-medium truncate">{name}</span>
                <span className="text-xs text-blue-400 truncate">Verbinde…</span>
            </div>
        </div>
    );
}

function ScreenShareTile({ share, onClick, onClose, focused = false }) {
    const showPlaceholder = !share.isLocal && !share.isSubscribed;
    function handleClick() {
        if (showPlaceholder) { share.subscribe?.(); return; }
        onClick?.();
    }
    return (
        <div
            onClick={handleClick}
            className={`group relative flex flex-col rounded-xl bg-black overflow-hidden ring-2 transition-all w-full h-full ${
                focused ? 'ring-primary' : 'ring-primary/30 hover:ring-primary/80 cursor-pointer'
            }`}
        >
            <div className="absolute z-10 top-2 left-2 max-w-[80%] px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm text-white text-xs font-medium flex items-center gap-1.5">
                <FontAwesomeIcon icon={faDisplay} className="shrink-0" />
                <span className="truncate">{share.name}</span>
                {share.isLocal && <span className="text-green-300 shrink-0">(Du)</span>}
            </div>
            {focused && onClose && (
                <button
                    onClick={(e) => { e.stopPropagation(); onClose(); }}
                    className="absolute z-10 top-2 right-2 w-8 h-8 rounded-md bg-black/60 hover:bg-black/80 text-white flex items-center justify-center cursor-pointer transition-colors"
                    title="Fokus aufheben"
                >
                    <FontAwesomeIcon icon={faXmark} />
                </button>
            )}
            {share.track && <div className="w-full h-full"><VoiceVideoTile track={share.track} muted={share.isLocal} /></div>}
            {showPlaceholder && (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                    <button
                        onClick={(e) => { e.stopPropagation(); share.subscribe?.(); }}
                        className="relative z-10 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/80 transition-colors font-medium flex items-center gap-2 cursor-pointer text-sm shadow-lg"
                    >
                        <FontAwesomeIcon icon={faPlay} />
                        Stream anschauen
                    </button>
                </div>
            )}
        </div>
    );
}

export default function ConversationCallView({ conversationId, participants: convoParticipants, onClose, chatPanel }) {
    const { user } = useAuth();
    const {
        conversationId: activeId,
        participants: liveParticipants = [],
        screenShares = [],
        muted, toggleMute,
        deafened, toggleDeafen,
        leaveVoice,
        setScreenShareEnabled,
        connectionStatus,
    } = useVoice();
    const call = useConversationCall(conversationId);
    const duration = useCallDuration(call?.startedAt);
    const [showChat, setShowChat] = useState(false);
    const [focusedShareId, setFocusedShareId] = useState(null);
    const [shareMenuOpen, setShareMenuOpen] = useState(false);
    const shareMenuRef = useRef(null);

    const inThisCall = activeId === conversationId;
    const isConnecting = inThisCall && (connectionStatus === 'connecting' || connectionStatus === 'reconnecting');

    const userById = useMemo(() => {
        const map = new Map();
        for (const p of (convoParticipants ?? [])) map.set(p.user.id, p.user);
        return map;
    }, [convoParticipants]);

    const visibleParticipants = useMemo(() => {
        let list;
        if (inThisCall) {
            list = liveParticipants
                .filter(p => !isConnecting || !p.isLocal)
                .map(p => {
                    const u = userById.get(p.identity);
                    return { ...p, avatar: u?.avatar, displayName: u?.displayName ?? u?.username };
                });
        } else {
            const ids = call?.participants ?? [];
            list = ids.map(id => {
                const u = userById.get(id) ?? { id, username: id };
                return {
                    identity: id,
                    name: u.displayName ?? u.username,
                    avatar: u.avatar,
                    isSpeaking: false, isMuted: false, isDeafened: false,
                };
            });
        }
        const seen = new Set();
        return list.filter(p => {
            if (!p.identity || seen.has(p.identity)) return false;
            seen.add(p.identity);
            return true;
        });
    }, [inThisCall, liveParticipants, call?.participants, userById, isConnecting]);

    const localShare = screenShares.find(s => s.isLocal);
    const focusedShare = focusedShareId ? screenShares.find(s => s.identity === focusedShareId) : null;

    // Auto-clear the focus when its underlying share disappears.
    useEffect(() => {
        if (focusedShareId && !screenShares.some(s => s.identity === focusedShareId)) {
            setFocusedShareId(null);
        }
    }, [focusedShareId, screenShares]);

    // Close share menu on outside click.
    useEffect(() => {
        if (!shareMenuOpen) return;
        function onDown(e) {
            if (shareMenuRef.current && !shareMenuRef.current.contains(e.target)) setShareMenuOpen(false);
        }
        document.addEventListener('mousedown', onDown);
        return () => document.removeEventListener('mousedown', onDown);
    }, [shareMenuOpen]);

    async function toggleScreenShare() {
        if (!setScreenShareEnabled) return;
        await setScreenShareEnabled(!localShare);
    }

    const tiles = [
        ...screenShares.map(s => ({ kind: 'share', key: `share-${s.identity}`, share: s })),
        ...visibleParticipants.map(p => ({ kind: 'user', key: `user-${p.identity}`, participant: p })),
    ];
    const totalTiles = tiles.length + (isConnecting ? 1 : 0);

    function renderTile(t) {
        if (t.kind === 'share') {
            return <ScreenShareTile key={t.key} share={t.share} onClick={() => setFocusedShareId(t.share.identity)} />;
        }
        return (
            <ParticipantTile
                key={t.key}
                participant={t.participant}
                avatar={t.participant.avatar}
                avatarSize={totalTiles <= 2 ? 'w-24 h-24' : totalTiles <= 4 ? 'w-20 h-20' : 'w-16 h-16'}
            />
        );
    }

    return (
        <div className="flex flex-1 min-h-0 bg-background">
            {/* Stage column */}
            <div className="group/stage relative flex flex-col flex-1 min-h-0 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Sprachanruf
                        </span>
                        <span className="text-sm text-foreground tabular-nums">{duration}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setShowChat(v => !v)}
                            title={showChat ? 'Chat ausblenden' : 'Chat anzeigen'}
                            className={`cursor-pointer w-9 h-9 flex items-center justify-center rounded-md transition-colors ${
                                showChat ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                            }`}
                        >
                            <FontAwesomeIcon icon={faMessage} />
                        </button>
                        <button
                            onClick={onClose}
                            title="Anrufansicht schliessen"
                            className="cursor-pointer w-9 h-9 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        >
                            <FontAwesomeIcon icon={faXmark} />
                        </button>
                    </div>
                </div>

                {/* Stage body */}
                {focusedShare ? (
                    <div className="flex-1 flex flex-col gap-3 p-4 sm:p-6 pb-28 min-h-0 min-w-0">
                        <div className="flex-1 min-h-0 min-w-0">
                            <ScreenShareTile share={focusedShare} focused onClose={() => setFocusedShareId(null)} />
                        </div>
                        <div className="flex gap-2 overflow-x-auto shrink-0 h-24">
                            {screenShares.filter(s => s.identity !== focusedShareId).map(share => (
                                <div key={`strip-share-${share.identity}`} className="aspect-video h-full shrink-0">
                                    <ScreenShareTile share={share} onClick={() => setFocusedShareId(share.identity)} />
                                </div>
                            ))}
                            {isConnecting && (
                                <div className="aspect-video h-full shrink-0">
                                    <ConnectingTile user={user} avatarSize="w-10 h-10" />
                                </div>
                            )}
                            {visibleParticipants.map(p => (
                                <div key={`strip-user-${p.identity}`} className="aspect-video h-full shrink-0">
                                    <ParticipantTile participant={p} avatar={p.avatar} avatarSize="w-10 h-10" />
                                </div>
                            ))}
                        </div>
                    </div>
                ) : totalTiles > 0 ? (
                    <div className="flex-1 flex items-center justify-center p-4 sm:p-6 pb-28 min-h-0 overflow-hidden">
                        {(() => {
                            // Column count picks a layout that keeps tiles roughly
                            // square-ish: 1 → centred small card, 2-4 → 2 cols,
                            // 5-9 → 3 cols, 10+ → 4 cols. Each cell is aspect-video,
                            // so the grid grows to natural height (not 100%).
                            const cols = totalTiles === 1 ? 1
                                : totalTiles <= 4 ? 2
                                : totalTiles <= 9 ? 3
                                : 4;
                            const maxWidth = totalTiles === 1 ? '24rem' : '64rem';
                            return (
                                <div className="grid gap-3 w-full"
                                    style={{
                                        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                                        maxWidth,
                                    }}
                                >
                                    {isConnecting && (
                                        <div className="aspect-video min-w-0">
                                            <ConnectingTile user={user} avatarSize="w-16 h-16" />
                                        </div>
                                    )}
                                    {tiles.map(t => (
                                        <div key={t.key} className="aspect-video min-w-0">
                                            {renderTile(t)}
                                        </div>
                                    ))}
                                </div>
                            );
                        })()}
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                        <FontAwesomeIcon icon={faPhone} className="text-4xl mb-2" />
                        <div className="text-sm">Niemand im Anruf</div>
                    </div>
                )}

                {/* Floating controls — pill layout like VoiceChannelView */}
                <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover/stage:opacity-100 transition-opacity duration-200 pointer-events-none z-10" />
                <div className="absolute bottom-4 left-0 right-0 mx-auto w-max flex items-center justify-center gap-2 z-20 transition-opacity duration-200 opacity-0 pointer-events-none group-hover/stage:opacity-100 group-hover/stage:pointer-events-auto focus-within:opacity-100 focus-within:pointer-events-auto">
                    <div className="flex items-center gap-1 bg-guild-bar/95 backdrop-blur-md p-1.5 rounded-2xl border border-border shadow-xl">
                        <button
                            onClick={toggleMute}
                            className={`cursor-pointer text-lg rounded-xl w-11 h-11 flex items-center justify-center transition-colors ${muted ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'text-foreground hover:bg-muted/70'}`}
                            title={muted ? 'Stummschaltung aufheben' : 'Stummschalten'}
                        >
                            <FontAwesomeIcon icon={muted ? faMicrophoneSlash : faMicrophone} />
                        </button>
                        <button
                            onClick={toggleDeafen}
                            className={`cursor-pointer text-lg rounded-xl w-11 h-11 flex items-center justify-center transition-colors ${deafened ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'text-foreground hover:bg-muted/70'}`}
                            title={deafened ? 'Ton wieder einschalten' : 'Ton stummschalten'}
                        >
                            <FontAwesomeIcon icon={deafened ? faHeadphonesSlash : faHeadphones} />
                        </button>
                        {localShare ? (
                            <div ref={shareMenuRef} className="relative">
                                <button
                                    onClick={() => setShareMenuOpen(v => !v)}
                                    className="cursor-pointer text-lg rounded-xl w-11 h-11 flex items-center justify-center bg-green-500/20 text-green-300 hover:bg-green-500/30 transition-colors"
                                    title="Stream-Optionen"
                                >
                                    <FontAwesomeIcon icon={faDisplay} />
                                </button>
                                {shareMenuOpen && (
                                    <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-popover border border-border rounded-lg shadow-xl overflow-hidden min-w-[200px]">
                                        <p className="px-3 pt-2 pb-1.5 text-xs text-muted-foreground font-semibold uppercase tracking-wider">Bildschirm teilen</p>
                                        <div className="border-t border-border" />
                                        <button
                                            onClick={() => { toggleScreenShare(); setShareMenuOpen(false); }}
                                            className="w-full px-3 py-2 text-sm text-red-400 hover:bg-muted text-left flex items-center gap-2 cursor-pointer transition-colors"
                                        >
                                            <FontAwesomeIcon icon={faXmark} className="w-4" />
                                            Stream beenden
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <button
                                onClick={toggleScreenShare}
                                className="cursor-pointer text-lg rounded-xl w-11 h-11 flex items-center justify-center text-foreground hover:bg-muted/70 transition-colors"
                                title="Bildschirm teilen"
                            >
                                <FontAwesomeIcon icon={faDisplay} />
                            </button>
                        )}
                    </div>
                    <div className="flex items-center bg-red-500/95 backdrop-blur-md rounded-2xl p-0.5 border border-red-400/60 shadow-xl">
                        <button
                            onClick={leaveVoice}
                            className="cursor-pointer text-lg rounded-xl w-11 h-11 flex items-center justify-center text-white hover:bg-red-600 transition-colors"
                            title="Anruf verlassen"
                        >
                            <FontAwesomeIcon icon={faPhone} className="rotate-[135deg]" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Chat drawer on the right when toggled on */}
            {showChat && chatPanel && (
                <div className="w-[440px] xl:w-[520px] shrink-0 border-l border-border flex flex-col min-h-0">
                    {chatPanel}
                </div>
            )}
        </div>
    );
}
