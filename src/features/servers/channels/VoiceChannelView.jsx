import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
    faMoon,
} from "@awesome.me/kit-95376d5d61/icons/classic/light";
import {
    faDisplay,
    faPhone,
    faPlay,
    faUsers,
    faLock,
} from "@awesome.me/kit-95376d5d61/icons/classic/solid";
import { fetchChannel, fetchChannels, fetchServer } from "../../../services/api.js";
import { hasPermission, hasChannelPermission, PERMISSIONS } from "../../../services/permissions.js";
import { useVoice } from "../../../hooks/useVoice.jsx";
import { useAuth } from "../../../hooks/useAuth.js";
import { useChannelParticipants } from "../../../hooks/useChannelParticipants.js";
import ContentHeader from "../../components/ContentHeader.jsx";
import UserAvatar from "../../components/UserAvatar.jsx";
import VoiceVideoTile from "../../components/VoiceVideoTile.jsx";
import Spinner from "../../components/static/Spinner.jsx";
import MemberSidebarList from "./MemberSidebarList.jsx";
import { useParticipantContextMenu } from "../../../hooks/useParticipantContextMenu.jsx";
import { useMemberAvatars } from "../../../hooks/useMemberAvatars.js";

function ParticipantTile({ participant, onContextMenu, avatarSize = 'w-20 h-20', avatar }) {
    const name = participant.name || participant.identity;
    return (
        <div
            onContextMenu={onContextMenu}
            className={`group relative flex flex-col items-center justify-center w-full h-full rounded-xl overflow-hidden bg-gradient-to-br from-card to-card/60 ring-2 transition-all ${
                participant.isSpeaking ? 'ring-primary shadow-[0_0_24px_-4px_rgba(88,101,242,0.5)]' : 'ring-transparent'
            }`}
        >
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

function ConnectingTile({ user, connectionStatus, retryCount, avatarSize = 'w-20 h-20' }) {
    const isReconnecting = connectionStatus === 'reconnecting';
    const retryLabel = retryCount > 0 ? ` (${retryCount}/5)` : '';
    const statusText = isReconnecting ? `Neuverbindung...${retryLabel}` : `Verbinde...${retryLabel}`;
    const statusColor = isReconnecting ? 'text-yellow-400' : 'text-blue-400';
    const name = user.displayName ?? user.username;

    return (
        <div className="relative flex flex-col items-center justify-center w-full h-full rounded-xl overflow-hidden bg-gradient-to-br from-card to-card/60 ring-2 ring-transparent">
            <div className="relative">
                <UserAvatar
                    icon={name.charAt(0).toUpperCase()}
                    avatar={user.avatar}
                    displayOnline={false}
                    size={avatarSize}
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                    <FontAwesomeIcon icon={faArrowsRotate} className="animate-spin text-white text-xl" />
                </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 flex items-center gap-2 px-2.5 py-1.5 bg-gradient-to-t from-black/70 to-transparent">
                <span className="text-foreground text-sm font-medium truncate">{name}</span>
                <span className={`text-xs ${statusColor} truncate`}>{statusText}</span>
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
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                    <FontAwesomeIcon icon={faDisplay} className="absolute text-zinc-700/60 text-[clamp(4rem,15vw,9rem)] blur-sm" />
                    <button
                        onClick={(e) => { e.stopPropagation(); share.subscribe?.(); }}
                        className="relative z-10 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/80 transition-colors font-medium flex items-center gap-2 cursor-pointer text-sm shadow-lg"
                    >
                        <FontAwesomeIcon icon={faPlay} />
                        Stream anschauen
                    </button>
                </div>
            )}
            {!showPlaceholder && !share.isLocal && (
                <button
                    onClick={(e) => { e.stopPropagation(); share.unsubscribe?.(); }}
                    className={`absolute z-10 bottom-2 left-1/2 -translate-x-1/2 w-9 h-9 rounded-md bg-red-500/70 hover:bg-red-500 text-white flex items-center justify-center cursor-pointer transition-all ${
                        focused ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}
                    title="Stream nicht mehr anschauen"
                >
                    <FontAwesomeIcon icon={faDisplaySlash} />
                </button>
            )}
        </div>
    );
}

function VoiceChannelView() {
    const { channelId, serverId } = useParams();
    const { user } = useAuth();
    const [showMemberSidebar, setShowMemberSidebar] = useState(
        () => typeof window === 'undefined' || window.innerWidth >= 768
    );

    const {
        isConnected,
        channelId: activeChannelId,
        participants: liveParticipants = [],
        screenShares: allScreenShares = [],
        muted,
        toggleMute,
        deafened,
        toggleDeafen,
        leaveVoice,
        joinVoice,
        setScreenShareEnabled,
        connectionStatus,
        retryCount,
        voiceError,
        clearVoiceError,
        setVoiceError,
    } = useVoice();
    const { data: serverData } = useQuery({
        queryKey: ['server', serverId],
        queryFn: () => fetchServer(serverId),
        staleTime: 5 * 60 * 1000,
    });
    const { data: serverChannels = [], isSuccess: channelsLoaded } = useQuery({
        queryKey: ['channels', serverId],
        queryFn: () => fetchChannels(serverId),
        staleTime: 10 * 60 * 1000,
    });
    const handleParticipantContextMenu = useParticipantContextMenu({
        server: serverData,
        channels: serverChannels,
        currentChannelId: channelId,
    });

    const isActive = isConnected && activeChannelId === channelId;
    const isConnectingHere = activeChannelId === channelId && (connectionStatus === 'connecting' || connectionStatus === 'reconnecting');

    const { data: channel, isLoading } = useQuery({
        queryKey: ['channel', channelId],
        queryFn: () => fetchChannel(channelId),
        staleTime: 10 * 60 * 1000,
    });

    const polledParticipants = useChannelParticipants(isActive ? null : channelId);
    const participants = isActive ? liveParticipants : polledParticipants;
    const avatarByUserId = useMemberAvatars(serverId);

    // screenShares from VoiceContext is global — it lives wherever the user is
    // currently connected (could be a private call). Gate to this channel so a
    // foreign-room share doesn't render here.
    const screenShares = isActive ? allScreenShares : [];

    const localShare = useMemo(
        () => screenShares.find(s => s.isLocal),
        [screenShares]
    );

    const [focusedShareId, setFocusedShareId] = useState(null);
    const [shareMenuOpen, setShareMenuOpen] = useState(false);
    const shareMenuRef = useRef(null);

    const stageObserverRef = useRef(null);
    const [stageSize, setStageSize] = useState({ w: 0, h: 0 });
    const stageRef = useCallback((node) => {
        if (stageObserverRef.current) {
            stageObserverRef.current.disconnect();
            stageObserverRef.current = null;
        }
        if (!node) return;
        const ro = new ResizeObserver(entries => {
            for (const e of entries) setStageSize({ w: e.contentRect.width, h: e.contentRect.height });
        });
        ro.observe(node);
        stageObserverRef.current = ro;
    }, []);

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

    // Channel object from the server's list carries the effective permissions
    // mask (server perms + overwrites + private-access). If the list has
    // loaded and this channel isn't in it, the backend filtered us out — i.e.
    // we have no VIEW_CHANNEL here, which collapses CONNECT_VOICE too.
    const channelInList = serverChannels.find(c => c.id === channelId);
    const channelFilteredOut = channelsLoaded && !channelInList;
    const channelWithPerms = channelInList ?? channel;
    const isAfkChannel = serverData?.afkChannelId === channelId;
    // canConnect resolution: AFK is always joinable, owners/admins bypass
    // inside hasChannelPermission; otherwise honour the channel mask. If the
    // channel was filtered out of the list, we know we can't connect.
    const canConnect = isAfkChannel || (!channelFilteredOut
        && hasChannelPermission(channelWithPerms, serverData, PERMISSIONS.CONNECT_VOICE));
    const isPrivateLocked = !canConnect && (channelWithPerms?.isPrivate || channelFilteredOut);

    async function handleJoin() {
        if (!channel || connectionStatus === 'connecting') return;
        clearVoiceError?.();

        if (!canConnect) {
            setVoiceError?.(isPrivateLocked
                ? 'Dieser Sprachkanal ist privat — du wurdest nicht freigegeben.'
                : 'Du hast keine Berechtigung, Sprachkanäle zu betreten.');
            return;
        }

        const canManage = hasChannelPermission(channelWithPerms, serverData, PERMISSIONS.MANAGE_CHANNELS);
        if (channel.userLimit && participants.length >= channel.userLimit && !canManage) {
            setVoiceError?.('Dieser Sprachkanal ist voll.');
            return;
        }

        await joinVoice({
            channel,
            server: { id: serverId, name: channel.serverName ?? '' },
            attributes: {
                muted,
                deafened,
            }
        });
    }

    const visibleParticipants = participants.filter(p => !isConnectingHere || !p.isLocal);
    const tileCount = screenShares.length + visibleParticipants.length + (isConnectingHere ? 1 : 0);

    const tileLayout = useMemo(() => {
        const gap = 12;
        const padding = 24;
        const reservedBottom = 96;
        const availW = Math.max(0, stageSize.w - padding * 2);
        const availH = Math.max(0, stageSize.h - padding * 2 - reservedBottom);
        if (!availW || !availH || tileCount === 0) return { cols: 1, tileW: 0, tileH: 0 };

        const targetAspect = 16 / 9;
        let best = { cols: 1, area: 0, tileW: 0, tileH: 0 };
        for (let cols = 1; cols <= tileCount; cols++) {
            const rows = Math.ceil(tileCount / cols);
            const maxTileW = (availW - (cols - 1) * gap) / cols;
            const maxTileH = (availH - (rows - 1) * gap) / rows;
            if (maxTileW <= 0 || maxTileH <= 0) continue;
            let tileW, tileH;
            if (maxTileW / maxTileH > targetAspect) {
                tileH = maxTileH;
                tileW = tileH * targetAspect;
            } else {
                tileW = maxTileW;
                tileH = tileW / targetAspect;
            }
            const area = tileW * tileH;
            if (area > best.area) best = { cols, area, tileW, tileH };
        }
        return best;
    }, [stageSize, tileCount]);

    const avatarSize = tileLayout.tileH < 140
        ? 'w-12 h-12'
        : tileLayout.tileH < 220
            ? 'w-16 h-16'
            : tileLayout.tileH < 320
                ? 'w-20 h-20'
                : 'w-28 h-28';

    if (isLoading || !channel) return <Spinner size="w-10 h-10" />;

    return (
        <>
            <ContentHeader>
                <div className="flex items-center text-foreground gap-3">
                    {/* Mirror the sidebar icon logic: lock when locked, lock-
                        overlay when private+accessible, moon for AFK, plain
                        volume otherwise. */}
                    {!canConnect ? (
                        <FontAwesomeIcon icon={faLock} />
                    ) : channelWithPerms?.isPrivate && !isAfkChannel ? (
                        <span className="relative inline-flex items-center justify-center w-[1em] h-[1em]">
                            <FontAwesomeIcon icon={faVolumeHigh} />
                            <FontAwesomeIcon
                                icon={faLock}
                                className="absolute -bottom-1 -right-1 text-[8px] text-muted-foreground/90 bg-background rounded-sm px-[1px]"
                            />
                        </span>
                    ) : (
                        <FontAwesomeIcon icon={isAfkChannel ? faMoon : faVolumeHigh} />
                    )}
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
                <div className="ml-auto flex items-center gap-2">
                    <button
                        onClick={() => setShowMemberSidebar(v => !v)}
                        title={showMemberSidebar ? 'Mitgliederliste ausblenden' : 'Mitgliederliste anzeigen'}
                        className={`flex items-center justify-center w-8 h-8 rounded-md cursor-pointer transition-colors ${
                            showMemberSidebar ? 'text-foreground bg-muted/50' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        }`}
                    >
                        <FontAwesomeIcon icon={faUsers} />
                    </button>
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
                <div ref={stageRef} className="group/stage relative flex flex-col w-full h-full">
                    {focusedShare ? (
                        <div className="flex-1 flex flex-col gap-3 p-4 sm:p-6 pb-32 min-h-0 min-w-0">
                            <div className="flex-1 min-h-0 min-w-0">
                                <ScreenShareTile
                                    share={focusedShare}
                                    focused
                                    onClose={() => setFocusedShareId(null)}
                                />
                            </div>
                            <div className="flex gap-2 overflow-x-auto shrink-0 h-28">
                                {screenShares.filter(s => s.identity !== focusedShareId).map(share => (
                                    <div key={share.identity + '-screen-strip'} className="aspect-video h-full shrink-0">
                                        <ScreenShareTile
                                            share={share}
                                            onClick={() => setFocusedShareId(share.identity)}
                                        />
                                    </div>
                                ))}
                                {participants.map(p => (
                                    <div key={p.identity + '-strip'} className="aspect-video h-full shrink-0">
                                        <ParticipantTile
                                            participant={p}
                                            avatar={p.avatar ?? avatarByUserId.get(p.identity)}
                                            avatarSize="w-12 h-12"
                                            onContextMenu={(e) => handleParticipantContextMenu(e, p)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        tileCount > 0 ? (
                            <div className="flex-1 flex items-center justify-center w-full min-h-0 overflow-hidden">
                                <div
                                    className="grid"
                                    style={{
                                        gridTemplateColumns: `repeat(${tileLayout.cols}, ${tileLayout.tileW}px)`,
                                        gridAutoRows: `${tileLayout.tileH}px`,
                                        gap: '12px',
                                    }}
                                >
                                    {screenShares.map(share => (
                                        <ScreenShareTile
                                            key={share.identity + '-screen'}
                                            share={share}
                                            onClick={() => setFocusedShareId(share.identity)}
                                        />
                                    ))}

                                    {isConnectingHere && (
                                        <ConnectingTile
                                            user={user}
                                            connectionStatus={connectionStatus}
                                            retryCount={retryCount}
                                            avatarSize={avatarSize}
                                        />
                                    )}

                                    {visibleParticipants.map(p => (
                                        <ParticipantTile
                                            key={p.identity}
                                            participant={p}
                                            avatar={p.avatar ?? avatarByUserId.get(p.identity)}
                                            avatarSize={avatarSize}
                                            onContextMenu={(e) => handleParticipantContextMenu(e, p)}
                                        />
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex w-full flex-col items-center justify-center text-muted-foreground pb-24">
                                <FontAwesomeIcon icon={faVolumeHigh} className="text-5xl mb-3" />
                                <div className="text-lg">Noch niemand im Channel</div>
                            </div>
                        )
                    )}

                    {isActive && (
                        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover/stage:opacity-100 transition-opacity duration-200 pointer-events-none z-10" />
                    )}

                    <div className={`absolute bottom-4 left-0 right-0 mx-auto w-max flex items-center justify-center gap-2 z-20 transition-opacity duration-200 ${
                        isActive
                            ? 'opacity-0 pointer-events-none group-hover/stage:opacity-100 group-hover/stage:pointer-events-auto focus-within:opacity-100 focus-within:pointer-events-auto'
                            : 'opacity-100 pointer-events-auto'
                    }`}>
                        {isActive ? (
                            <div className="flex items-center gap-2">
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
                                                        onClick={switchScreenShare}
                                                        className="w-full px-3 py-2 text-sm text-foreground hover:bg-muted text-left flex items-center gap-2 cursor-pointer transition-colors"
                                                    >
                                                        <FontAwesomeIcon icon={faArrowsRotate} className="w-4" />
                                                        Fenster wechseln
                                                    </button>
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
                                        title="Verlassen"
                                    >
                                        <FontAwesomeIcon icon={faPhone} className="rotate-[135deg]" />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={handleJoin}
                                disabled={connectionStatus === 'connecting' || !canConnect}
                                title={!canConnect
                                    ? (isPrivateLocked
                                        ? 'Dieser Sprachkanal ist privat — du wurdest nicht freigegeben'
                                        : 'Keine Berechtigung, Sprachkanäle zu betreten')
                                    : undefined}
                                className="cursor-pointer rounded-2xl px-6 h-12 flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/80 transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed shadow-xl"
                            >
                                {connectionStatus === 'connecting' ? (
                                    <>
                                        <FontAwesomeIcon icon={faArrowsRotate} className="animate-spin" />
                                        Verbinde...
                                    </>
                                ) : !canConnect ? (
                                    <>
                                        <FontAwesomeIcon icon={faTriangleExclamation} />
                                        {isPrivateLocked ? 'Privater Kanal' : 'Keine Berechtigung'}
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
                {showMemberSidebar && (
                    <>
                        <div
                            onClick={() => setShowMemberSidebar(false)}
                            className="md:hidden fixed inset-0 bg-black/40 z-30"
                        />
                        <div className="fixed md:relative inset-y-0 right-0 md:inset-auto z-40 md:z-auto w-72 max-w-[85vw] md:w-full md:max-w-xs bg-card md:bg-card/70 h-full border-l border-border">
                            {/* If the channel was filtered out of our list (we got
                                mod-moved into a private room we don't have access
                                to), the channel-scoped members endpoint would
                                403. Drop back to the server-wide roster instead. */}
                            <MemberSidebarList
                                serverId={channel.serverId}
                                channelId={channelFilteredOut ? undefined : channelId}
                            />
                        </div>
                    </>
                )}
            </div>
        </>
    );
}

export default VoiceChannelView;