import { useState, useMemo } from 'react';
import { VoiceContext } from './VoiceContext';
import {fetchVoiceToken} from '../services/api';
import { useAuth } from '../hooks/useAuth';
import {getSocket} from "../services/socket.js";
import {playJoinSound, playLeaveSound} from "../services/sounds.js";

export function VoiceProvider({ children }) {
    const { user } = useAuth();
    const [krispState, setKrispState] = useState(null);

    const [voiceState, setVoiceState] = useState({
        token: null,
        channelId: null,
        serverUrl: null,
        channelName: null,
        serverId: null,
        serverName: null,
        muted: false,
        deafened: false,
    });


    function setKrisp(krisp) {
        setKrispState(krisp);
    }

    function setParticipants(participants) {
        setVoiceState(prev => ({ ...prev, participants }));
    }

    async function joinVoice({ channel, server }) {
        if (voiceState.channelId === channel.id) return;

        const socket = getSocket();

        // Erst alten Channel verlassen
        if (voiceState.token && socket) {
            socket.emit('voice:leave', { channelId: voiceState.channelId });
            setVoiceState(prev => ({ ...prev, token: null }));
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        const res = await fetchVoiceToken({
            roomName: `channel-${channel.id}`,
            userId: user.id,
            username: user.username,
        });

        setVoiceState({
            token: res.token,
            channelId: channel.id,
            serverUrl: res.url,
            channelName: channel.name,
            serverId: server.id,
            serverName: server.name,
            muted: voiceState.muted,
            deafened: voiceState.deafened,
        });

        playJoinSound();
    }

    function leaveVoice() {
        playLeaveSound();

        const socket = getSocket();
        if (socket && voiceState.channelId) {
            socket.emit('voice:leave', { channelId: voiceState.channelId });
        }

        setVoiceState({
            token: null,
            channelId: null,
            serverUrl: null,
            channelName: null,
            serverId: null,
            serverName: null,
            muted: false,
            deafened: false,
        });
    }
    function toggleMute() {
        setVoiceState(prev => ({ ...prev, muted: !prev.muted }));
    }

    function toggleDeafen() {
        setVoiceState(prev => ({ ...prev, deafened: !prev.deafened }));
    }

    const value = useMemo(() => ({
        ...voiceState,
        isConnected: !!voiceState.token,
        krisp: krispState,
        joinVoice,
        leaveVoice,
        toggleMute,
        toggleDeafen,
        setParticipants,
        setKrisp,
    }), [voiceState, krispState]);

    return (
        <VoiceContext.Provider value={value}>
            {children}
        </VoiceContext.Provider>
    );
}