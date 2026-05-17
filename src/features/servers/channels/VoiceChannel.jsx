import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {useVoice} from "../../../hooks/useVoice.jsx";
import {faDisplay, faMicrophoneSlash, faVolumeHigh, faHeadphonesSlash} from "@awesome.me/kit-95376d5d61/icons/classic/light";
import {faArrowsRotate, faGear} from "@awesome.me/kit-95376d5d61/icons/classic/regular";
import {useChannelParticipants} from "../../../hooks/useChannelParticipants.js";
import UserAvatar from "../../components/UserAvatar.jsx";
import {useNavigate} from "react-router-dom";
import {useAuth} from "../../../hooks/useAuth.js";
import HasUserPopup from "../../components/user/HasUserPopup.jsx";

function VoiceChannel({ channel, server, onSettings }) {
    const { joinVoice, channelId: activeChannelId, muted, deafened, participants: liveParticipants = [], connectionStatus, retryCount } = useVoice();
    const { user } = useAuth();
    const navigate = useNavigate();
    const isActive = activeChannelId === channel.id;
    const isConnecting = isActive && (connectionStatus === 'connecting' || connectionStatus === 'reconnecting');

    const polledParticipants = useChannelParticipants(isActive ? null : channel.id);
    const participants = isActive ? liveParticipants : polledParticipants;
    const hasAnyPresence = isConnecting || (participants || []).length > 0;

    async function handleClick() {
        if (!isActive) await joinVoice({ channel, server, attributes: {
                muted,
                deafened,
            }
        });
        navigate(`/servers/${server.id}/voice/${channel.id}`);
    }

    return (
        <div className="flex flex-col gap-1">
            <div className="group relative flex items-center">
                <button
                    onClick={handleClick}
                    className={`${isActive ? 'bg-muted/50 text-foreground' : 'text-muted-foreground'} cursor-pointer w-full flex items-center gap-2.5 px-2 py-1 pr-7 rounded-md font-medium transition-all hover:text-foreground hover:bg-muted/50`}>
                    <FontAwesomeIcon className={`shrink-0 ${hasAnyPresence ? 'text-primary' : ''}`} icon={faVolumeHigh} />
                    <span className="truncate">{channel.name}</span>
                </button>
                <button
                    onClick={() => onSettings?.(channel)}
                    className="absolute right-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground cursor-pointer p-0.5 rounded"
                    title="Kanaleinstellungen"
                >
                    <FontAwesomeIcon icon={faGear} className="text-xs" />
                </button>
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
                        <button key={p.identity} className="w-full flex text-foreground cursor-pointer items-center gap-2 px-2 py-1 rounded-md font-medium transition-all hover:text-foreground hover:bg-muted/50">
                            <div className={`ring-3 ${p.isSpeaking ? 'ring-primary' : 'ring-transparent'} rounded-full`}>
                                <UserAvatar icon={(p.name || '').charAt(0).toUpperCase()} displayOnline={false} size="w-6 h-6" />
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