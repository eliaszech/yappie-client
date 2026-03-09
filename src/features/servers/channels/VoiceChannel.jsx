import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {useVoice} from "../../../hooks/useVoice.jsx";
import {faMicrophoneSlash, faVolumeHigh} from "@awesome.me/kit-95376d5d61/icons/classic/light";
import {useChannelParticipants} from "../../../hooks/useChannelParticipants.js";

function VoiceChannel({ channel, server }) {
    const { joinVoice, channelId: activeChannelId, participants: liveParticipants = [] } = useVoice();
    const isActive = activeChannelId === channel.id;

    const polledParticipants = useChannelParticipants(isActive ? null : channel.id);
    const participants = isActive ? liveParticipants : polledParticipants;

    return (
        <div className="flex flex-col gap-1">
            <button
                onClick={() => joinVoice({ channel, server })}
                className={`${isActive ? 'bg-muted/50 text-foreground' : 'text-muted-foreground'} cursor-pointer w-full flex items-center gap-2.5 px-2 py-1 rounded-md font-medium transition-all hover:text-foreground hover:bg-muted/50`}>
                <FontAwesomeIcon className={`${(participants || []).length > 0 ? 'text-green-300' : '' }`} icon={faVolumeHigh} />
                {channel.name}
            </button>
            {(participants || []).length > 0 && (
                <div className="pl-7">
                    {participants.map(p => (
                        <button key={p.identity} className="w-full flex text-foreground items-center gap-2.5 px-2 py-1 rounded-md font-medium transition-all hover:text-foreground hover:bg-muted/50">
                            <span className={`w-5 h-5 rounded-full ${p.isSpeaking ? 'bg-green-300' : 'bg-muted-foreground'}`} />
                            <span className="text-foreground">{p.name}</span>
                            {p.isMuted && (
                                <FontAwesomeIcon icon={faMicrophoneSlash} className="text-red-400" />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export default VoiceChannel;