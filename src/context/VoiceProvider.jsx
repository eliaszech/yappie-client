import { useState, useMemo } from 'react';
import { VoiceContext } from './VoiceContext';
import {fetchVoiceToken} from '../services/api';
import { useAuth } from '../hooks/useAuth';
import {getSocket} from "../services/socket.js";
import {playJoinSound, playLeaveSound} from "../services/sounds.js";

export function VoiceProvider({ children }) {
    const { user } = useAuth();
    const [krispState, setKrispState] = useState(null);
    const [screenShares, setScreenSharesState] = useState([]);
    const [voiceActions, setVoiceActionsState] = useState({});

    const [voiceState, setVoiceState] = useState({
        token: null,
        channelId: null,
        serverUrl: null,
        channelName: null,
        serverId: null,
        serverName: null,
        participants: [],
        muted: false,
        deafened: false,
    });


    function setKrisp(krisp) {
        setKrispState(krisp);
    }

    function setParticipants(participants) {
        setVoiceState(prev => ({ ...prev, participants }));
    }

    function setScreenShares(shares) {
        setScreenSharesState(shares);
    }

    function registerVoiceActions(actions) {
        setVoiceActionsState(actions);
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
            username: user.displayName ?? user.username,
        });

        setVoiceState({
            token: res.token,
            channelId: channel.id,
            serverUrl: res.url,
            channelName: channel.name,
            serverId: server.id,
            serverName: server.name,
            participants: [],
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
            participants: [],
            muted: false,
            deafened: false,
        });
        setScreenSharesState([]);
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
        screenShares,
        joinVoice,
        leaveVoice,
        toggleMute,
        toggleDeafen,
        setParticipants,
        setScreenShares,
        setKrisp,
        registerVoiceActions,
        setScreenShareEnabled: voiceActions.setScreenShareEnabled,
    }), [voiceState, krispState, screenShares, voiceActions]);

    return (
        <VoiceContext.Provider value={value}>
            {children}
        </VoiceContext.Provider>
    );
}