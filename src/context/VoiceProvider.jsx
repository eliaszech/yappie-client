import { useState, useMemo } from 'react';
import { VoiceContext } from './VoiceContext';
import {fetchVoiceToken} from '../services/api';
import { useAuth } from '../hooks/useAuth';
import {getSocket} from "../services/socket.js";
import {
    playJoinSound,
    playLeaveSound,
    playMuteOnSound,
    playMuteOffSound,
    playDeafenOnSound,
    playDeafenOffSound,
} from "../services/sounds.js";

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
        conversationId: null,
        serverUrl: null,
        channelName: null,
        serverId: null,
        serverName: null,
        conversationName: null,
        participants: [],
        muted: false,
        deafened: false,
        mutedByDeafen: false,
        isAfk: false,
        bitrate: null,
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

    // joinVoice supports two shapes:
    //   - server voice channel: { channel, server, attributes }
    //   - direct/group call:    { conversation: { id, name }, attributes }
    async function joinVoice({ channel, server, conversation, attributes = {} }) {
        const isConversation = !!conversation;
        const roomName = isConversation ? `conversation-${conversation.id}` : `channel-${channel.id}`;
        const newRoomId = isConversation ? conversation.id : channel.id;
        const currentRoomId = voiceState.conversationId ?? voiceState.channelId;
        if (currentRoomId === newRoomId && connectionStatus === 'connected') return;

        setVoiceErrorState(null);
        setConnectionStatusState('connecting');

        // Set room info immediately so UI can show name during connecting phase.
        setVoiceState(prev => ({
            ...prev,
            channelId: isConversation ? null : channel.id,
            channelName: isConversation ? null : channel.name,
            serverId: isConversation ? null : server.id,
            serverName: isConversation ? null : server.name,
            conversationId: isConversation ? conversation.id : null,
            conversationName: isConversation ? (conversation.name ?? null) : null,
        }));

        const socket = getSocket();

        if (voiceState.token && socket) {
            const leavePayload = voiceState.conversationId
                ? { conversationId: voiceState.conversationId }
                : { channelId: voiceState.channelId };
            socket.emit('voice:leave', leavePayload);
            setVoiceState(prev => ({ ...prev, token: null }));
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        const res = await fetchVoiceToken({
            roomName,
            userId: user.id,
            username: user.displayName ?? user.username,
            attributes
        });

        if (res.error) {
            setVoiceErrorState(res.error);
            setConnectionStatusState('error');
            setVoiceState(prev => ({
                ...prev,
                token: null,
                channelId: null,
                conversationId: null,
                serverUrl: null,
                channelName: null,
                serverId: null,
                serverName: null,
                conversationName: null,
                participants: [],
                isAfk: false,
            }));
            return;
        }

        setVoiceState(prev => ({
            ...prev,
            token: res.token,
            serverUrl: res.url,
            isAfk: !!res.afk,
            bitrate: res.bitrate ?? null,
            muted: res.afk ? true : prev.muted,
            participants: [],
        }));

        playJoinSound();
    }

    async function refreshToken() {
        const roomName = voiceState.conversationId
            ? `conversation-${voiceState.conversationId}`
            : voiceState.channelId ? `channel-${voiceState.channelId}` : null;
        if (!roomName) return false;
        const res = await fetchVoiceToken({
            roomName,
            userId: user.id,
            username: user.displayName ?? user.username,
        });
        if (res.error) return false;
        setVoiceState(prev => {
            if (!prev.channelId && !prev.conversationId) return prev;
            return { ...prev, token: res.token, serverUrl: res.url, isAfk: !!res.afk, bitrate: res.bitrate ?? null };
        });
        return true;
    }

    function leaveVoice() {
        playLeaveSound();

        const socket = getSocket();
        if (socket) {
            if (voiceState.conversationId) {
                socket.emit('voice:leave', { conversationId: voiceState.conversationId });
            } else if (voiceState.channelId) {
                socket.emit('voice:leave', { channelId: voiceState.channelId });
            }
        }

        setVoiceState(prev => ({
            ...prev,
            token: null,
            channelId: null,
            conversationId: null,
            serverUrl: null,
            channelName: null,
            serverId: null,
            serverName: null,
            conversationName: null,
            participants: [],
            isAfk: false,
        }));
        setScreenSharesState([]);
        setConnectionStatusState('idle');
        setRetryCountState(0);
    }

    function toggleMute() {
        setVoiceState(prev => {
            if (prev.isAfk) return prev;
            const nextMuted = !prev.muted;
            if (nextMuted) playMuteOnSound();
            else playMuteOffSound();
            return { ...prev, muted: nextMuted, mutedByDeafen: false };
        });
    }

    function toggleDeafen() {
        setVoiceState(prev => {
            if (!prev.deafened) {
                playDeafenOnSound();
                return {
                    ...prev,
                    deafened: true,
                    muted: true,
                    mutedByDeafen: !prev.muted,
                };
            }
            playDeafenOffSound();
            return {
                ...prev,
                deafened: false,
                muted: prev.mutedByDeafen ? false : prev.muted,
                mutedByDeafen: false,
            };
        });
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
        setMicGain: voiceActions.setMicGain,
        setMicThreshold: voiceActions.setMicThreshold,
        setMicDevice: voiceActions.setMicDevice,
        setSpeakerDevice: voiceActions.setSpeakerDevice,
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