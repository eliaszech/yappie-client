import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faMicrophone,
    faVolumeHigh,
    faMicrophoneSlash,
    faXmark,
    faTriangleExclamation,
    faArrowsRotate, faDisplaySlash,
    faHeadphones,
    faHeadphonesSlash,
} from "@awesome.me/kit-95376d5d61/icons/classic/light";
import {
    faDisplay,
    faPhone,
    faPlay
} from "@awesome.me/kit-95376d5d61/icons/classic/solid";
import { fetchChannel } from "../../../services/api.js";
import { useVoice } from "../../../hooks/useVoice.jsx";
import { useAuth } from "../../../hooks/useAuth.js";
import { useChannelParticipants } from "../../../hooks/useChannelParticipants.js";
import ContentHeader from "../../components/ContentHeader.jsx";
import UserAvatar from "../../components/UserAvatar.jsx";
import VoiceVideoTile from "../../components/VoiceVideoTile.jsx";
import Spinner from "../../components/static/Spinner.jsx";
import MemberSidebarList from "./MemberSidebarList.jsx";
import { useContextMenu } from "../../../hooks/useContextMenu.js";
import { getStoredVolume } from "../../../services/participantVolume.js";

function VolumeSlider({ identity, onChange }) {
    const [volume, setVolume] = useState(() => getStoredVolume(identity, 1));

    function handleChange(e) {
        const v = Number(e.target.value);
        setVolume(v);
        onChange(v);
    }

    return (
        <div className="flex flex-col gap-1.5 py-0.5 min-w-[180px]">
            <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Lautstärke</span>
                <span className="text-foreground tabular-nums">{Math.round(volume * 100)}%</span>
            </div>
            <input
                type="range"
                min="0"
                max="2"
                step="0.05"
                value={volume}
                onChange={handleChange}
                className="w-full accent-primary cursor-pointer"
            />
        </div>
    );
}

function ParticipantTile({ participant, onContextMenu }) {
    return (
        <div
            onContextMenu={onContextMenu}
            className={`relative flex flex-col items-center justify-center gap-2 aspect-video rounded-xl bg-card ring-2 transition-all ${participant.isSpeaking ? 'ring-primary' : 'ring-transparent'}`}
        >
            {participant.isScreenSharing && (
                <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-green-500/20 text-green-300 text-xs font-medium">
                    <FontAwesomeIcon icon={faDisplay} />
                    <span>Live</span>
                </div>
            )}
            <UserAvatar
                icon={(participant.name || '?').charAt(0).toUpperCase()}
                displayOnline={false}
                size="w-20 h-20"
            />
            <div className="flex items-center gap-2 text-foreground text-sm font-medium">
                <span>{participant.name || participant.identity}</span>
                {participant.isMuted && (
                    <FontAwesomeIcon icon={faMicrophoneSlash} className="text-red-400" />
                )}
                {participant.isDeafened && (
                    <FontAwesomeIcon icon={faHeadphonesSlash} className="text-red-400" title="Ton aus" />
                )}
            </div>
        </div>
    );
}

function ConnectingTile({ user, connectionStatus, retryCount }) {
    const isReconnecting = connectionStatus === 'reconnecting';
    const retryLabel = retryCount > 0 ? ` (${retryCount}/5)` : '';
    const statusText = isReconnecting ? `Neuverbindung...${retryLabel}` : `Verbinde...${retryLabel}`;
    const statusColor = isReconnecting ? 'text-yellow-400' : 'text-blue-400';

    return (
        <div className="relative flex flex-col items-center justify-center gap-2 aspect-video rounded-xl bg-card ring-2 ring-transparent">
            <div className="relative">
                <UserAvatar
                    icon={(user.displayName ?? user.username).charAt(0).toUpperCase()}
                    avatar={user.avatar}
                    displayOnline={false}
                    size="w-20 h-20"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                    <FontAwesomeIcon icon={faArrowsRotate} className="animate-spin text-white text-2xl" />
                </div>
            </div>
            <div className="flex items-center gap-2 text-foreground text-sm font-medium">
                <span>{user.displayName ?? user.username}</span>
                <span className={`text-xs ${statusColor}`}>{statusText}</span>
            </div>
        </div>
    );
}

function ScreenShareTile({ share, onClick, onClose, focused = false }) {
    const showPlaceholder = !share.isLocal && !share.isSubscribed;

    function handleTileClick() {
        if (showPlaceholder) {
            share.subscribe?.();
            return;
        }
        onClick?.();
    }

    return (
        <div
            onClick={handleTileClick}
            className={`relative flex flex-col rounded-xl bg-black overflow-hidden ring-2 transition-all ${focused ? 'ring-primary' : 'ring-primary/40 hover:ring-primary/80 cursor-pointer'} ${focused ? 'h-full' : 'aspect-video'}`}
        >
            <div className="absolute z-10 top-2 left-2 px-2 py-1 rounded-md bg-black/60 text-white text-xs font-medium flex items-center gap-1.5">
                <FontAwesomeIcon icon={faDisplay} />
                <span>{share.name}</span>
                {share.isLocal && <span className="text-green-300">(Du)</span>}
            </div>
            {focused && onClose && (
                <button
                    onClick={(e) => { e.stopPropagation(); onClose(); }}
                    className="absolute z-10 top-2 right-2 w-8 h-8 rounded-md bg-black/60 hover:bg-black/80 text-white flex items-center justify-center cursor-pointer"
                    title="Vergrößerung schließen"
                >
                    <FontAwesomeIcon icon={faXmark} />
                </button>
            )}
            {share.track && (
                <div className="w-full h-full">
                    <VoiceVideoTile track={share.track} muted={share.isLocal} />
                </div>
            )}
            {showPlaceholder && (
                <div className="absolute inset-0 flex items-center justify-center bg-primary/10">
                    <FontAwesomeIcon icon={faDisplay} className="absolute text-zinc-700 text-9xl blur-sm" />
                    <div className="relative z-10 flex flex-col items-center">
                        <button
                            onClick={(e) => { e.stopPropagation(); share.subscribe?.(); }}
                            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/80 transition-colors font-medium flex items-center gap-2 cursor-pointer text-sm"
                        >
                            <FontAwesomeIcon icon={faPlay} />
                            Stream anschauen
                        </button>
                    </div>
                </div>
            )}
            {!showPlaceholder && (
                <button onClick={(e) => { e.stopPropagation(); share.unsubscribe?.(); }}
                        className="absolute z-10 bottom-2 mx-auto left-0 right-0 w-9 h-9 rounded-md bg-red-500/60 hover:bg-red-500/80 text-white flex items-center justify-center cursor-pointer">
                    <FontAwesomeIcon icon={faDisplaySlash} />
                </button>
            )}
        </div>
    );
}

function VoiceChannelView() {
    const { channelId, serverId } = useParams();
    const { user } = useAuth();

    const {
        isConnected,
        channelId: activeChannelId,
        participants: liveParticipants = [],
        screenShares = [],
        muted,
        toggleMute,
        deafened,
        toggleDeafen,
        leaveVoice,
        joinVoice,
        setScreenShareEnabled,
        setParticipantVolume,
        connectionStatus,
        retryCount,
        voiceError,
        clearVoiceError,
    } = useVoice();
    const { openContextMenu } = useContextMenu();

    function buildParticipantMenu(participant) {
        return [
            { header: true, label: participant.name || participant.identity },
            {
                render: () => (
                    <VolumeSlider
                        identity={participant.identity}
                        onChange={(v) => setParticipantVolume?.(participant.identity, v)}
                    />
                ),
            },
        ];
    }

    function handleParticipantContextMenu(e, participant) {
        if (participant.isLocal) return;
        openContextMenu(e, buildParticipantMenu(participant));
    }

    const isActive = isConnected && activeChannelId === channelId;
    const isConnectingHere = activeChannelId === channelId && (connectionStatus === 'connecting' || connectionStatus === 'reconnecting');

    const { data: channel, isLoading } = useQuery({
        queryKey: ['channel', channelId],
        queryFn: () => fetchChannel(channelId),
        staleTime: 10 * 60 * 1000,
    });

    const polledParticipants = useChannelParticipants(isActive ? null : channelId);
    const participants = isActive ? liveParticipants : polledParticipants;

    const localShare = useMemo(
        () => screenShares.find(s => s.isLocal),
        [screenShares]
    );

    const [focusedShareId, setFocusedShareId] = useState(null);
    const [shareMenuOpen, setShareMenuOpen] = useState(false);
    const shareMenuRef = useRef(null);

    useEffect(() => {
        if (!shareMenuOpen) return;
        function onMousedown(e) {
            if (!shareMenuRef.current?.contains(e.target)) setShareMenuOpen(false);
        }
        document.addEventListener('mousedown', onMousedown);
        return () => document.removeEventListener('mousedown', onMousedown);
    }, [shareMenuOpen]);
    const focusedShare = useMemo(
        () => screenShares.find(s => s.identity === focusedShareId),
        [screenShares, focusedShareId]
    );

    useEffect(() => {
        if (focusedShareId && !focusedShare) setFocusedShareId(null);
    }, [focusedShareId, focusedShare]);

    async function toggleScreenShare() {
        if (!setScreenShareEnabled) return;
        await setScreenShareEnabled(!localShare);
    }

    async function switchScreenShare() {
        if (!setScreenShareEnabled) return;
        setShareMenuOpen(false);
        await setScreenShareEnabled(false);
        await new Promise(r => setTimeout(r, 150));
        await setScreenShareEnabled(true);
    }

    async function handleJoin() {
        if (!channel || connectionStatus === 'connecting') return;
        clearVoiceError?.();
        await joinVoice({
            channel,
            server: { id: serverId, name: channel.serverName ?? '' },
            attributes: {
                muted,
                deafened,
            }
        });
    }

    if (isLoading || !channel) return <Spinner size="w-10 h-10" />;

    return (
        <>
            <ContentHeader>
                <div className="flex items-center text-foreground gap-3">
                    <FontAwesomeIcon icon={faVolumeHigh} />
                    <span className="font-medium">{channel.name}</span>
                    {isActive && connectionStatus === 'connected' && (
                        <span className="text-xs text-primary ml-2">Verbunden</span>
                    )}
                    {isActive && connectionStatus === 'reconnecting' && (
                        <span className="text-xs text-yellow-400 ml-2 flex items-center gap-1">
                            <FontAwesomeIcon icon={faArrowsRotate} className="animate-spin" />
                            {retryCount > 0 ? `Neuverbindung... (${retryCount}/5)` : 'Neuverbindung...'}
                        </span>
                    )}
                    {isActive && connectionStatus === 'connecting' && (
                        <span className="text-xs text-blue-400 ml-2 flex items-center gap-1">
                            {retryCount > 0 && <FontAwesomeIcon icon={faArrowsRotate} className="animate-spin" />}
                            {retryCount > 0 ? `Verbinde... (${retryCount}/5)` : 'Verbinde...'}
                        </span>
                    )}
                </div>
            </ContentHeader>

            {voiceError && (
                <div className="absolute top-0 right-0 mx-6 mt-4 px-4 py-3 rounded-lg bg-red-500/50 border border-red-400 text-white flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faTriangleExclamation} />
                        <span>{voiceError}</span>
                    </div>
                    <button onClick={clearVoiceError} className="cursor-pointer hover:text-red-300 ml-4 shrink-0">
                        <FontAwesomeIcon icon={faXmark} />
                    </button>
                </div>
            )}

            <div className="flex h-full w-full overflow-hidden">
                <div className="flex flex-col w-full h-full">
                    {focusedShare ? (
                        <div className="flex-1 flex flex-col gap-3 p-6 min-h-0">
                            <div className="flex-1 min-h-0">
                                <ScreenShareTile
                                    share={focusedShare}
                                    focused
                                    onClose={() => setFocusedShareId(null)}
                                />
                            </div>
                            <div className="flex gap-2 overflow-x-auto shrink-0">
                                {screenShares.filter(s => s.identity !== focusedShareId).map(share => (
                                    <div key={share.identity + '-screen-strip'} className="w-48 shrink-0">
                                        <ScreenShareTile
                                            share={share}
                                            onClick={() => setFocusedShareId(share.identity)}
                                        />
                                    </div>
                                ))}
                                {participants.map(p => (
                                    <div key={p.identity + '-strip'} className="w-48 shrink-0">
                                        <ParticipantTile
                                            participant={p}
                                            onContextMenu={(e) => handleParticipantContextMenu(e, p)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        participants.length > 0 || isConnectingHere ? (
                            <div className="flex h-full items-center w-full overflow-y-auto p-6">
                                <div className="grid w-full h-max grid-cols-2 gap-3">
                                    {screenShares.length > 0 && screenShares.map(share => (
                                        <ScreenShareTile
                                            key={share.identity + '-screen'}
                                            share={share}
                                            onClick={() => setFocusedShareId(share.identity)}
                                        />
                                    ))}

                                    {isConnectingHere && (
                                        <ConnectingTile user={user} connectionStatus={connectionStatus} retryCount={retryCount} />
                                    )}

                                    {participants.filter(p => !isConnectingHere || !p.isLocal).map(p => (
                                        <ParticipantTile
                                            key={p.identity}
                                            participant={p}
                                            onContextMenu={(e) => handleParticipantContextMenu(e, p)}
                                        />
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="flex w-full flex-col items-center justify-center text-muted-foreground h-full">
                                <FontAwesomeIcon icon={faVolumeHigh} className="text-5xl mb-3" />
                                <div className="text-lg">Noch niemand im Channel</div>
                            </div>
                        )
                    )}

                    <div className="relative mx-auto w-max bottom-4 flex items-center justify-center gap-3">
                        {isActive ? (
                            <>
                                <div className="flex items-center gap-2 bg-guild-bar p-1.5 h-14 rounded-xl border border-border">
                                    <button
                                        onClick={toggleMute}
                                        className={`cursor-pointer text-xl rounded-lg w-11 h-11 flex items-center justify-center transition-colors ${muted ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'text-foreground hover:bg-muted/70'}`}
                                        title={muted ? 'Stummschaltung aufheben' : 'Stummschalten'}
                                    >
                                        <FontAwesomeIcon icon={muted ? faMicrophoneSlash : faMicrophone} />
                                    </button>
                                    <button
                                        onClick={toggleDeafen}
                                        className={`cursor-pointer text-xl rounded-lg w-11 h-11 flex items-center justify-center transition-colors ${deafened ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'text-foreground hover:bg-muted/70'}`}
                                        title={deafened ? 'Ton wieder einschalten' : 'Ton stummschalten'}
                                    >
                                        <FontAwesomeIcon icon={deafened ? faHeadphonesSlash : faHeadphones} />
                                    </button>
                                    {localShare ? (
                                        <div ref={shareMenuRef} className="relative">
                                            <button
                                                onClick={() => setShareMenuOpen(v => !v)}
                                                className="cursor-pointer rounded-lg w-11 h-11 flex items-center justify-center bg-green-500/20 text-green-300 hover:bg-green-500/30 transition-colors"
                                                title="Stream-Optionen"
                                            >
                                                <FontAwesomeIcon icon={faDisplay} />
                                            </button>
                                            {shareMenuOpen && (
                                                <div className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 bg-popover border border-border rounded-lg shadow-lg overflow-hidden min-w-[200px]">
                                                    <p className="px-3 pt-1 pb-1.5 text-xs text-muted-foreground font-medium">Bildschirm teilen</p>
                                                    <div className="border-t border-border" />
                                                    <button
                                                        onClick={switchScreenShare}
                                                        className="w-full px-3 py-2 text-sm text-foreground hover:bg-muted text-left flex items-center gap-2 cursor-pointer"
                                                    >
                                                        <FontAwesomeIcon icon={faArrowsRotate} />
                                                        Fenster wechseln
                                                    </button>
                                                    <button
                                                        onClick={() => { toggleScreenShare(); setShareMenuOpen(false); }}
                                                        className="w-full px-3 py-2 text-sm text-red-400 hover:bg-muted text-left flex items-center gap-2 cursor-pointer"
                                                    >
                                                        <FontAwesomeIcon icon={faXmark} />
                                                        Stream beenden
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <button
                                            onClick={toggleScreenShare}
                                            className="cursor-pointer rounded-lg w-11 h-11 h-full flex items-center justify-center text-foreground hover:bg-muted/70 transition-colors"
                                            title="Bildschirm teilen"
                                        >
                                            <FontAwesomeIcon icon={faDisplay} />
                                        </button>
                                    )}
                                </div>
                                <button
                                    onClick={leaveVoice}
                                    className="cursor-pointer rounded-xl px-4 h-12 flex items-center justify-center bg-red-500 text-white hover:bg-red-500/80 transition-colors"
                                    title="Verlassen"
                                >
                                    <FontAwesomeIcon icon={faPhone} />
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={handleJoin}
                                disabled={connectionStatus === 'connecting'}
                                className="cursor-pointer rounded-xl px-6 h-11 flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/80 transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {connectionStatus === 'connecting' ? (
                                    <>
                                        <FontAwesomeIcon icon={faArrowsRotate} className="animate-spin" />
                                        Verbinde...
                                    </>
                                ) : (
                                    <>
                                        <FontAwesomeIcon icon={faVolumeHigh} />
                                        Sprachkanal beitreten
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
                <div className="max-w-xs w-full bg-card/70 h-full border-l border-border">
                    <MemberSidebarList serverId={channel.serverId} />
                </div>
            </div>
        </>
    );
}

export default VoiceChannelView;