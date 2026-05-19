import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {useVoice} from "../../../hooks/useVoice.jsx";
import {faDisplay, faMicrophoneSlash, faVolumeHigh, faHeadphonesSlash, faMoon, faLock} from "@awesome.me/kit-95376d5d61/icons/classic/light";
import {faArrowsRotate, faGear} from "@awesome.me/kit-95376d5d61/icons/classic/regular";
import {hasPermission, PERMISSIONS} from "../../../services/permissions.js";
import {useChannelParticipants} from "../../../hooks/useChannelParticipants.js";
import UserAvatar from "../../components/UserAvatar.jsx";
import {useNavigate} from "react-router-dom";
import {useAuth} from "../../../hooks/useAuth.js";
import HasUserPopup from "../../components/user/HasUserPopup.jsx";
import { useParticipantContextMenu } from "../../../hooks/useParticipantContextMenu.jsx";
import { useMemberAvatars } from "../../../hooks/useMemberAvatars.js";
import { useQuery } from "@tanstack/react-query";
import { fetchChannels } from "../../../services/api.js";

function VoiceChannel({ channel, server, onSettings, canManage = true }) {
    const { joinVoice, channelId: activeChannelId, muted, deafened, participants: liveParticipants = [], connectionStatus, retryCount, setVoiceError } = useVoice();
    const { user } = useAuth();
    const navigate = useNavigate();
    const { data: serverChannels = [] } = useQuery({
        queryKey: ['channels', server.id],
        queryFn: () => fetchChannels(server.id),
        staleTime: 10 * 60 * 1000,
    });
    const handleParticipantContextMenu = useParticipantContextMenu({
        server,
        channels: serverChannels,
        currentChannelId: channel.id,
    });
    const isActive = activeChannelId === channel.id;
    const isConnecting = isActive && (connectionStatus === 'connecting' || connectionStatus === 'reconnecting');
    const isConnected = isActive && connectionStatus === 'connected';
    const isAfkChannel = server.afkChannelId && channel.id === server.afkChannelId;
    // Connect gate: AFK is publicly joinable; otherwise prefer the per-channel
    // effective permission mask shipped with the channel object (so a deny
    // overwrite locks the channel even if the role has server-level
    // CONNECT_VOICE). Falls back to the server-level check if the field is
    // absent — old cache entries, defensive default.
    const hasChannelMask = typeof channel.permissions === 'number';
    const canConnect = isAfkChannel || (
        hasChannelMask
            ? (channel.permissions & PERMISSIONS.CONNECT_VOICE) !== 0
            : hasPermission(server, PERMISSIONS.CONNECT_VOICE)
    );

    // While connecting, keep the polled list visible so the already-present
    // users don't blink out before LiveKit emits its first participant snapshot.
    const polledParticipants = useChannelParticipants(isConnected ? null : channel.id);
    const participants = isConnected ? liveParticipants : polledParticipants;
    const hasAnyPresence = isConnecting || (participants || []).length > 0;
    const avatarByUserId = useMemberAvatars(server.id);

    async function handleClick() {
        if (!isActive) {
            if (!canConnect) {
                // User can still inspect who's in the channel — the view itself
                // surfaces the lock. We just don't attempt to join.
                navigate(`/servers/${server.id}/voice/${channel.id}`);
                return;
            }
            // Pre-flight cap check against the already-cached participant list
            // so we don't briefly render ourselves as "connecting" before the
            // token endpoint rejects the join. Backend re-enforces this; the
            // client check is just to avoid the flicker.
            const limit = channel.userLimit;
            const count = (participants || []).length;
            if (limit && count >= limit && !canManage) {
                setVoiceError?.('Dieser Sprachkanal ist voll.');
                navigate(`/servers/${server.id}/voice/${channel.id}`);
                return;
            }
            await joinVoice({ channel, server, attributes: { muted, deafened } });
        }
        navigate(`/servers/${server.id}/voice/${channel.id}`);
    }

    return (
        <div className="flex flex-col gap-1">
            <div className="group relative flex items-center">
                <button
                    onClick={handleClick}
                    title={
                        isAfkChannel ? 'AFK-Kanal – Mikro ist hier gesperrt'
                        : !canConnect ? 'Keine Berechtigung, Sprachkanäle zu betreten'
                        : undefined
                    }
                    className={`${isActive ? 'bg-muted/50 text-foreground' : 'text-muted-foreground'} ${!canConnect ? 'opacity-60' : ''} cursor-pointer w-full flex items-center gap-2.5 px-2 py-1 pr-7 rounded-md font-medium transition-all hover:text-foreground hover:bg-muted/50`}>
                    <FontAwesomeIcon className={`shrink-0 ${hasAnyPresence ? 'text-primary' : ''}`} icon={!canConnect ? faLock : isAfkChannel ? faMoon : faVolumeHigh} />
                    <span className="truncate">{channel.name}</span>
                    {isAfkChannel ? (
                        <span className="ml-auto text-[10px] uppercase tracking-wider text-muted-foreground/70 font-semibold mr-1">
                            AFK
                        </span>
                    ) : channel.userLimit ? (
                        <span
                            className="ml-auto text-[10px] tabular-nums text-muted-foreground/70 font-medium mr-1 shrink-0"
                            title={`${(participants || []).length} von ${channel.userLimit} Plätzen belegt`}
                        >
                            {(participants || []).length}/{channel.userLimit}
                        </span>
                    ) : null}
                </button>
                {canManage && (
                    <button
                        onClick={() => onSettings?.(channel)}
                        className="absolute right-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground cursor-pointer p-0.5 rounded"
                        title="Kanaleinstellungen"
                    >
                        <FontAwesomeIcon icon={faGear} className="text-xs" />
                    </button>
                )}
            </div>
            {hasAnyPresence && (
                <div className="pl-7">
                    {isConnecting && (
                        <div className="w-full flex text-muted-foreground items-center gap-2 px-2 py-1 rounded-md">
                            <div className="w-6 h-6 flex items-center justify-center shrink-0">
                                <FontAwesomeIcon
                                    icon={faArrowsRotate}
                                    className={`animate-spin text-xs ${connectionStatus === 'reconnecting' ? 'text-yellow-400' : 'text-blue-400'}`}
                                />
                            </div>
                            <span>{user.displayName ?? user.username}</span>
                            {retryCount > 0 && (
                                <span className="text-xs ml-auto opacity-60">{retryCount}/5</span>
                            )}
                        </div>
                    )}
                    {(participants || []).filter(p => !isConnecting || !p.isLocal).map(p => (
                        <button
                            key={p.identity}
                            onContextMenu={(e) => handleParticipantContextMenu(e, p)}
                            className="w-full flex text-foreground cursor-pointer items-center gap-2 px-2 py-1 rounded-md font-medium transition-all hover:text-foreground hover:bg-muted/50"
                        >
                            <div className={`ring-3 ${p.isSpeaking ? 'ring-primary' : 'ring-transparent'} rounded-full`}>
                                <UserAvatar icon={(p.name || '').charAt(0).toUpperCase()} avatar={p.avatar ?? avatarByUserId.get(p.identity)} displayOnline={false} size="w-6 h-6" />
                            </div>
                            <div className={p.isSpeaking ? 'text-foreground' : 'text-muted-foreground'}>{p.displayName ?? p.name}</div>
                            <div className="ml-auto flex items-center gap-1.5">
                                {p.isScreenSharing && (
                                    <FontAwesomeIcon icon={faDisplay} className="text-green-400 text-xs" title="Streamt" />
                                )}
                                {p.isMuted && (
                                    <FontAwesomeIcon icon={faMicrophoneSlash} className="text-red-400" />
                                )}
                                {p.isDeafened && (
                                    <FontAwesomeIcon icon={faHeadphonesSlash} className="text-red-400" title="Ton aus" />
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export default VoiceChannel;