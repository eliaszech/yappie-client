import { LiveKitRoom, RoomAudioRenderer, useLocalParticipant, useParticipants, useTracks } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { useVoice } from "../../hooks/useVoice.jsx";
import { useEffect, useMemo, useRef, useState } from "react";
import { createRnnoiseProcessor } from "../../services/rnnoiseProcessor";

function VoiceRoomContent() {
    const participants = useParticipants();
    const { localParticipant, microphoneTrack } = useLocalParticipant();
    const { setParticipants, setKrisp, setScreenShares, registerVoiceActions, muted } = useVoice();

    const screenTracks = useTracks([Track.Source.ScreenShare], { onlySubscribed: true });

    const [enabled, setEnabled] = useState(
        () => localStorage.getItem('krisp-enabled') === 'true'
    );
    const processorRef = useRef(null);

    useEffect(() => {
        setParticipants(participants.map(p => ({
            identity: p.identity,
            name: p.name,
            isSpeaking: p.isSpeaking,
            isLocal: p.isLocal,
            isMuted: p.isMicrophoneEnabled === false,
            isScreenSharing: p.isScreenShareEnabled,
        })));
    }, [participants]);

    useEffect(() => {
        setScreenShares(screenTracks.map(t => ({
            identity: t.participant.identity,
            name: t.participant.name || t.participant.identity,
            isLocal: t.participant.isLocal,
            track: t.publication?.track,
        })).filter(s => s.track));
    }, [screenTracks]);

    useEffect(() => {
        const track = microphoneTrack?.track;
        if (!track) return;

        (async () => {
            if (enabled) {
                if (!processorRef.current) processorRef.current = createRnnoiseProcessor();
                await track.setProcessor(processorRef.current);
            } else if (processorRef.current) {
                await track.stopProcessor();
                processorRef.current = null;
            }
        })();
    }, [enabled, microphoneTrack?.track]);

    useEffect(() => {
        const track = microphoneTrack?.track;
        if (!track) return;
        if (muted) track.mute();
        else track.unmute();
    }, [muted, microphoneTrack?.track]);

    const noiseFilter = useMemo(() => ({
        isNoiseFilterEnabled: enabled,
        isNoiseFilterPending: false,
        setNoiseFilterEnabled: setEnabled,
    }), [enabled]);

    useEffect(() => { setKrisp(noiseFilter); }, [noiseFilter]);

    useEffect(() => {
        registerVoiceActions({
            setScreenShareEnabled: async (v) => {
                if (!localParticipant) return;
                await localParticipant.setScreenShareEnabled(v);
            },
        });
    }, [localParticipant]);

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