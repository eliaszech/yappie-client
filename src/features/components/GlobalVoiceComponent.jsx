import {LiveKitRoom, RoomAudioRenderer, useParticipants} from '@livekit/components-react';
import {useVoice} from "../../hooks/useVoice.jsx";
import {useEffect} from "react";
import {useKrispNoiseFilter} from "@livekit/components-react/krisp";

function VoiceRoomContent() {
    const participants = useParticipants();
    const { setParticipants, setKrisp } = useVoice();
    const krisp = useKrispNoiseFilter();

    useEffect(() => {
        setParticipants(participants.map(p => ({
            identity: p.identity,
            name: p.name,
            isSpeaking: p.isSpeaking,
        })));
    }, [participants]);

    useEffect(() => {
        const saved = localStorage.getItem('krisp-enabled') === 'true';
        if (saved && !krisp.isNoiseFilterEnabled) {
            krisp.setNoiseFilterEnabled(true);
        }
    }, []);

    useEffect(() => {
        setKrisp(krisp);
    }, [krisp?.isNoiseFilterEnabled, krisp?.isNoiseFilterPending])

    return <RoomAudioRenderer />;
}

function GlobalVoiceComponent() {
    const { token, isConnected, serverUrl } = useVoice();

    if (!isConnected) return null;

    return (
        <LiveKitRoom
            serverUrl={serverUrl}
            token={token}
            connect={true}
            audio={true}
            video={false}
        >
            <VoiceRoomContent />
        </LiveKitRoom>
    );
}

export default GlobalVoiceComponent;