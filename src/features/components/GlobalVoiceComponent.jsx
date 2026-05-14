import { LiveKitRoom, RoomAudioRenderer, useLocalParticipant, useParticipants, useTracks, useConnectionState } from '@livekit/components-react';
import { Track, ConnectionState, DisconnectReason } from 'livekit-client';
import { useVoice } from "../../hooks/useVoice.jsx";
import { useEffect, useMemo, useRef, useState } from "react";
import { createRnnoiseProcessor } from "../../services/rnnoiseProcessor";

function VoiceRoomContent() {
    const participants = useParticipants();
    const { localParticipant, microphoneTrack } = useLocalParticipant();
    const { setParticipants, setKrisp, setScreenShares, registerVoiceActions, muted, setConnectionStatus } = useVoice();
    const connectionState = useConnectionState();

    const screenTracks = useTracks([Track.Source.ScreenShare], { onlySubscribed: true });

    const [enabled, setEnabled] = useState(
        () => localStorage.getItem('krisp-enabled') === 'true'
    );
    const processorRef = useRef(null);

    useEffect(() => {
        if (connectionState === ConnectionState.Connected) {
            setConnectionStatus('connected');
        }
        // Reconnecting wird von handleDisconnected in GlobalVoiceComponent mit korrektem Count gesetzt
    }, [connectionState]);

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

const MAX_RETRIES = 5;

// LiveKit soll intern nicht selbst reconnecten – unser handleDisconnected übernimmt das mit Count-Anzeige
const NO_RECONNECT_POLICY = { nextRetryDelayInMs: () => null };

const DISCONNECT_MESSAGES = {
    [DisconnectReason.SERVER_SHUTDOWN]: 'Voice-Server wurde heruntergefahren',
    [DisconnectReason.ROOM_DELETED]: 'Voice-Raum wurde geschlossen',
    [DisconnectReason.PARTICIPANT_REMOVED]: 'Du wurdest aus dem Voice-Kanal entfernt',
    [DisconnectReason.ROOM_CLOSED]: 'Voice-Raum wurde geschlossen',
    [DisconnectReason.JOIN_FAILURE]: 'Voice-Server nicht erreichbar',
};

function GlobalVoiceComponent() {
    const { token, isConnected, serverUrl, setVoiceError, leaveVoice, setConnectionStatus, setRetryCount, refreshToken, connectionStatus } = useVoice();
    const retryCountRef = useRef(0);
    const hasConnectedRef = useRef(false);
    const connectionStatusRef = useRef(connectionStatus);

    useEffect(() => {
        connectionStatusRef.current = connectionStatus;
    }, [connectionStatus]);

    function handleConnected() {
        hasConnectedRef.current = true;
        retryCountRef.current = 0;
        setRetryCount(0);
    }

    async function handleDisconnected(reason) {
        if (reason === DisconnectReason.CLIENT_INITIATED) return;

        const wasConnected = hasConnectedRef.current;

        if (retryCountRef.current < MAX_RETRIES) {
            retryCountRef.current++;
            setRetryCount(retryCountRef.current);
            // Beim ersten Verbindungsaufbau "connecting" behalten, nach erfolgreicher Verbindung "reconnecting"
            setConnectionStatus(wasConnected ? 'reconnecting' : 'connecting');
            await new Promise(resolve => setTimeout(resolve, 2000));
            if (connectionStatusRef.current === 'idle') return; // User hat manuell verlassen während des Wartens
            const ok = await refreshToken();
            if (!ok) {
                retryCountRef.current = MAX_RETRIES;
                setVoiceError(DISCONNECT_MESSAGES[reason] ?? 'Verbindung zum Voice-Server unterbrochen');
                leaveVoice();
            }
        } else {
            retryCountRef.current = 0;
            hasConnectedRef.current = false;
            setVoiceError(DISCONNECT_MESSAGES[reason] ?? 'Verbindung zum Voice-Server unterbrochen');
            leaveVoice();
        }
    }

    if (!isConnected) return null;

    return (
        <LiveKitRoom
            key={token}
            serverUrl={serverUrl}
            token={token}
            connect={true}
            audio={true}
            video={false}
            options={{ reconnectPolicy: NO_RECONNECT_POLICY }}
            onConnected={handleConnected}
            onDisconnected={handleDisconnected}
        >
            <VoiceRoomContent />
        </LiveKitRoom>
    );
}

export default GlobalVoiceComponent;