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
    const [voiceError, setVoiceErrorState] = useState(null);
    const [connectionStatus, setConnectionStatusState] = useState('idle');
    const [retryCount, setRetryCountState] = useState(0);

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

    function setVoiceError(error) {
        setVoiceErrorState(error);
        setConnectionStatusState('error');
    }

    function setConnectionStatus(status) {
        setConnectionStatusState(status);
    }

    function setRetryCount(n) {
        setRetryCountState(n);
    }

    function clearVoiceError() {
        setVoiceErrorState(null);
        setConnectionStatusState('idle');
        setRetryCountState(0);
    }

    async function joinVoice({ channel, server }) {
        if (voiceState.channelId === channel.id && connectionStatus === 'connected') return;

        setVoiceErrorState(null);
        setConnectionStatusState('connecting');

        // Set channel info immediately so UI can show name during connecting phase
        setVoiceState(prev => ({
            ...prev,
            channelId: channel.id,
            channelName: channel.name,
            serverId: server.id,
            serverName: server.name,
        }));

        const socket = getSocket();

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

        if (res.error) {
            setVoiceErrorState(res.error);
            setConnectionStatusState('error');
            return;
        }

        setVoiceState(prev => ({
            ...prev,
            token: res.token,
            serverUrl: res.url,
            participants: [],
        }));

        playJoinSound();
    }

    async function refreshToken() {
        const channelId = voiceState.channelId;
        if (!channelId) return false;
        const res = await fetchVoiceToken({
            roomName: `channel-${channelId}`,
            userId: user.id,
            username: user.displayName ?? user.username,
        });
        if (res.error) return false;
        setVoiceState(prev => {
            if (!prev.channelId) return prev;
            return { ...prev, token: res.token, serverUrl: res.url };
        });
        return true;
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
        setConnectionStatusState('idle');
        setRetryCountState(0);
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
        connectionStatus,
        voiceError,
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
        setParticipantVolume: voiceActions.setParticipantVolume,
        setVoiceError,
        setConnectionStatus,
        setRetryCount,
        clearVoiceError,
        refreshToken,
        retryCount,
    }), [voiceState, krispState, screenShares, voiceActions, voiceError, connectionStatus, retryCount]);

    return (
        <VoiceContext.Provider value={value}>
            {children}
        </VoiceContext.Provider>
    );
}