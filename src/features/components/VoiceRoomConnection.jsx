import { LiveKitRoom, RoomAudioRenderer, useLocalParticipant, useParticipants, useTracks, useConnectionState, useRoomContext } from '@livekit/components-react';
import { Track, ConnectionState, DisconnectReason, LocalAudioTrack, RoomEvent } from 'livekit-client';
import { useVoice } from "../../hooks/useVoice.jsx";
import { useEffect, useMemo, useRef, useState } from "react";
import { createMicPipelineProcessor } from "../../services/micPipelineProcessor";
import { buildScreenShareOptions } from "../../services/screenShareQuality.js";
import { createWindowAudioStream } from "../../services/windowAudioStream.js";
import { getStoredVolume, setStoredVolume } from "../../services/participantVolume.js";
import {
    getMicDeviceId, setMicDeviceId,
    getSpeakerDeviceId, setSpeakerDeviceId,
    getMicGain, setMicGain,
} from "../../services/voiceSettings.js";
import { playJoinSound, playLeaveSound } from "../../services/sounds.js";

function VoiceRoomContent() {
    const participants = useParticipants();
    const { localParticipant, microphoneTrack } = useLocalParticipant();
    const { setParticipants, setKrisp, setScreenShares, registerVoiceActions, muted, deafened, setConnectionStatus } = useVoice();
    const connectionState = useConnectionState();
    const room = useRoomContext();

    const screenTracks = useTracks([Track.Source.ScreenShare], { onlySubscribed: false });

    const [enabled, setEnabled] = useState(
        () => localStorage.getItem('krisp-enabled') === 'true'
    );
    const processorRef = useRef(null);
    const windowAudioRef = useRef(null);

    // Per-window audio capture (Windows-only). Main process pipes PCM via IPC
    // when the user shared a window with audio enabled; we wrap it in a
    // LocalAudioTrack and publish it as ScreenShareAudio.
    useEffect(() => {
        if (!window.electronAPI?.onWindowAudioStarted) return;

        async function stopWindowAudioTrack() {
            const ref = windowAudioRef.current;
            if (!ref) return;
            windowAudioRef.current = null;
            try {
                await localParticipant?.unpublishTrack(ref.localTrack, true);
            } catch {}
            try {
                ref.stream.close();
            } catch {}
        }

        window.electronAPI.onWindowAudioStarted(async () => {
            await stopWindowAudioTrack();
            const stream = createWindowAudioStream();
            if (!stream || !localParticipant) return;

            const localTrack = new LocalAudioTrack(stream.track, undefined, false);
            windowAudioRef.current = { stream, localTrack };
            try {
                await localParticipant.publishTrack(localTrack, {
                    source: Track.Source.ScreenShareAudio,
                });
            } catch {
                await stopWindowAudioTrack();
            }
        });

        window.electronAPI.onWindowAudioStopped(() => {
            stopWindowAudioTrack();
        });

        window.electronAPI.onWindowAudioUnavailable(() => {
            // Capture couldn't start (no matching PID, app silent, etc.) — nothing to clean.
        });
    }, [localParticipant]);

    useEffect(() => {
        if (connectionState === ConnectionState.Connected) {
            setConnectionStatus('connected');
        }
    }, [connectionState]);

    useEffect(() => {
        setParticipants(participants.map(p => ({
            identity: p.identity,
            name: p.name,
            isSpeaking: p.isSpeaking,
            isLocal: p.isLocal,
            isMuted: p.isMicrophoneEnabled === false,
            isScreenSharing: p.isScreenShareEnabled,
            isDeafened: p.isLocal ? deafened : p.attributes?.deafened === '1',
        })));

        for (const p of participants) {
            if (p.isLocal) continue;
            const stored = getStoredVolume(p.identity, null);
            if (stored !== null && typeof p.setVolume === 'function') {
                p.setVolume(stored);
            }
        }
    }, [participants, deafened]);

    useEffect(() => {
        if (!localParticipant) return;
        if (connectionState !== ConnectionState.Connected) return;
        const streaming = screenTracks.some(t => t.participant.isLocal);
        localParticipant.setAttributes({
            deafened: deafened ? '1' : '0',
            streaming: streaming ? '1' : '0',
        }).catch((e) => {
            console.log(e)
        });
    }, [localParticipant, deafened, screenTracks, connectionState]);

    // Play join/leave cues when remote participants come and go. LiveKit only
    // fires these events for participants joining/leaving AFTER the local
    // participant connects, so existing participants don't trigger sounds.
    useEffect(() => {
        if (!room) return;
        function onParticipantJoined() { playJoinSound(); }
        function onParticipantLeft() { playLeaveSound(); }
        room.on(RoomEvent.ParticipantConnected, onParticipantJoined);
        room.on(RoomEvent.ParticipantDisconnected, onParticipantLeft);
        return () => {
            room.off(RoomEvent.ParticipantConnected, onParticipantJoined);
            room.off(RoomEvent.ParticipantDisconnected, onParticipantLeft);
        };
    }, [room]);

    // Auto-unsubscribe new remote screen share tracks (video + audio).
    // Users opt-in per-stream via the "Stream anzeigen" button.
    useEffect(() => {
        if (!room) return;
        function onTrackPublished(publication, participant) {
            if (participant.isLocal) return;
            const src = publication.source;
            if (src === Track.Source.ScreenShare || src === Track.Source.ScreenShareAudio) {
                publication.setSubscribed(false);
            }
        }
        room.on(RoomEvent.TrackPublished, onTrackPublished);
        // Also handle already-published tracks at the moment we mount/connect.
        for (const p of room.remoteParticipants.values()) {
            for (const pub of p.trackPublications.values()) {
                onTrackPublished(pub, p);
            }
        }
        return () => {
            room.off(RoomEvent.TrackPublished, onTrackPublished);
        };
    }, [room]);

    useEffect(() => {
        setScreenShares(screenTracks.map(t => {
            const publication = t.publication;
            const isLocal = t.participant.isLocal;
            const isSubscribed = isLocal || publication?.isSubscribed === true;
            return {
                identity: t.participant.identity,
                name: t.participant.name || t.participant.identity,
                isLocal,
                track: publication?.track ?? null,
                isSubscribed,
                publication,
                participant: t.participant,
                subscribe: () => {
                    if (isLocal || !publication) return;
                    publication.setSubscribed(true);
                    // Subscribe matching screen share audio (if any).
                    for (const pub of t.participant.trackPublications.values()) {
                        if (pub.source === Track.Source.ScreenShareAudio) {
                            pub.setSubscribed(true);
                        }
                    }
                },
                unsubscribe: () => {
                    if (isLocal || !publication) return;
                    publication.setSubscribed(false);
                    for (const pub of t.participant.trackPublications.values()) {
                        if (pub.source === Track.Source.ScreenShareAudio) {
                            pub.setSubscribed(false);
                        }
                    }
                },
            };
        }));
    }, [screenTracks]);

    useEffect(() => {
        const track = microphoneTrack?.track;
        if (!track) {
            processorRef.current = null;
            return;
        }
        (async () => {
            if (!processorRef.current) {
                processorRef.current = createMicPipelineProcessor({
                    initialGain: getMicGain(),
                    initialRnnoise: enabled,
                });
            }
            await track.setProcessor(processorRef.current);
        })();
    }, [microphoneTrack?.track]);

    useEffect(() => {
        processorRef.current?.setRnnoiseEnabled(enabled);
    }, [enabled]);

    useEffect(() => {
        if (connectionState !== ConnectionState.Connected) return;
        const speakerId = getSpeakerDeviceId();
        room.switchActiveDevice('audiooutput', speakerId).catch(() => {});
    }, [connectionState, room]);

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
                if (v) {
                    const { capture, publish } = buildScreenShareOptions();
                    await localParticipant.setScreenShareEnabled(true, capture, publish);
                } else {
                    window.electronAPI?.stopWindowAudio?.();
                    await localParticipant.setScreenShareEnabled(false);
                }
            },
            setParticipantVolume: (identity, volume) => {
                const target = participants.find(p => p.identity === identity && !p.isLocal);
                if (target && typeof target.setVolume === 'function') {
                    target.setVolume(volume);
                }
                setStoredVolume(identity, volume);
            },
            setMicGain: (value) => {
                setMicGain(value);
                processorRef.current?.setGain(value);
            },
            setMicDevice: async (deviceId) => {
                setMicDeviceId(deviceId);
                try {
                    await room.switchActiveDevice('audioinput', deviceId);
                } catch {}
            },
            setSpeakerDevice: async (deviceId) => {
                setSpeakerDeviceId(deviceId);
                try {
                    await room.switchActiveDevice('audiooutput', deviceId);
                } catch {}
            },
        });
    }, [localParticipant, participants, room]);

    return <RoomAudioRenderer muted={deafened} />;
}

const MAX_RETRIES = 5;
const NO_RECONNECT_POLICY = { nextRetryDelayInMs: () => null };

const DISCONNECT_MESSAGES = {
    [DisconnectReason.SERVER_SHUTDOWN]: 'Voice-Server wurde heruntergefahren',
    [DisconnectReason.ROOM_DELETED]: 'Voice-Raum wurde geschlossen',
    [DisconnectReason.PARTICIPANT_REMOVED]: 'Du wurdest aus dem Voice-Kanal entfernt',
    [DisconnectReason.ROOM_CLOSED]: 'Voice-Raum wurde geschlossen',
    [DisconnectReason.JOIN_FAILURE]: 'Voice-Server nicht erreichbar',
};

function VoiceRoomConnection() {
    const { token, serverUrl, setVoiceError, leaveVoice, setConnectionStatus, setRetryCount, refreshToken, connectionStatus } = useVoice();
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
            setConnectionStatus(wasConnected ? 'reconnecting' : 'connecting');
            await new Promise(resolve => setTimeout(resolve, 2000));
            if (connectionStatusRef.current === 'idle') return;
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

    const micId = getMicDeviceId();
    const speakerId = getSpeakerDeviceId();

    return (
        <LiveKitRoom
            key={token}
            serverUrl={serverUrl}
            token={token}
            connect={true}
            audio={{ deviceId: micId }}
            video={false}
            options={{
                reconnectPolicy: NO_RECONNECT_POLICY,
                webAudioMix: true,
                audioOutput: { deviceId: speakerId },
            }}
            onConnected={handleConnected}
            onDisconnected={handleDisconnected}
        >
            <VoiceRoomContent />
        </LiveKitRoom>
    );
}

export default VoiceRoomConnection;
