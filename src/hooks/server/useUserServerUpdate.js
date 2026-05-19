import {useQueryClient} from "@tanstack/react-query";
import {useCallback, useEffect, useRef, useState} from "react";
import {onUserServerUpdate} from "../../services/socket.js";
import {useAuth} from "../useAuth.js";
import {useLocation, useNavigate} from "react-router-dom";
import {useVoice} from "../useVoice.jsx";

export function useUserServerUpdate() {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { serverId: voiceServerId, leaveVoice } = useVoice();
    const userIdRef = useRef(user?.id);
    const pathnameRef = useRef(location.pathname);
    const voiceServerIdRef = useRef(voiceServerId);
    const leaveVoiceRef = useRef(leaveVoice);
    const [kicked, setKicked] = useState(null);
    const [banned, setBanned] = useState(null);

    useEffect(() => {
        userIdRef.current = user?.id;
    }, [user?.id]);

    useEffect(() => {
        pathnameRef.current = location.pathname;
    }, [location.pathname]);

    useEffect(() => {
        voiceServerIdRef.current = voiceServerId;
    }, [voiceServerId]);

    useEffect(() => {
        leaveVoiceRef.current = leaveVoice;
    }, [leaveVoice]);

    const dismissKicked = useCallback(() => {
        const info = kicked;
        setKicked(null);
        if (info && pathnameRef.current.startsWith(`/servers/${info.serverId}`)) {
            navigate('/@me/friends', { replace: true });
        }
    }, [kicked, navigate]);

    const dismissBanned = useCallback(() => {
        const info = banned;
        setBanned(null);
        if (info && pathnameRef.current.startsWith(`/servers/${info.serverId}`)) {
            navigate('/@me/friends', { replace: true });
        }
    }, [banned, navigate]);

    // Shared cleanup for both kick and ban: cut voice, evict caches.
    function evictFromServer(serverIdToEvict) {
        if (voiceServerIdRef.current === serverIdToEvict) {
            leaveVoiceRef.current?.();
        }
        // Snapshot the server's channel ids before we wipe the channels cache —
        // the channel-scoped member caches (['channelMembers', channelId]) are
        // keyed by channelId only, so we need this lookup to target just the
        // channels of the evicted server (and not blow away caches for other
        // servers the user is still in).
        const channels = queryClient.getQueryData(['channels', serverIdToEvict]) || [];
        const channelIds = new Set(channels.map(c => c.id));
        queryClient.setQueryData(['servers'], (old) =>
            old ? old.filter(s => s.id !== serverIdToEvict) : old
        );
        queryClient.removeQueries({ queryKey: ['server', serverIdToEvict] });
        queryClient.removeQueries({ queryKey: ['channels', serverIdToEvict] });
        queryClient.removeQueries({ queryKey: ['members', serverIdToEvict] });
        queryClient.removeQueries({
            predicate: (q) => q.queryKey[0] === 'channelMembers' && channelIds.has(q.queryKey[1]),
        });
    }

    // The sidebar member list switches to a channel-scoped fetch
    // (['channelMembers', channelId]) whenever a channel is open, so socket
    // events need to keep that cache in sync alongside the plain
    // ['members', serverId] roster. We don't know which channels the joining
    // member can see, so for joins we just invalidate channel-member caches
    // for that server and let the backend re-apply visibility filtering.
    function getServerChannelIds(serverIdToScope) {
        const channels = queryClient.getQueryData(['channels', serverIdToScope]) || [];
        return new Set(channels.map(c => c.id));
    }

    function removeFromChannelMemberCaches(serverIdToScope, userIdToRemove) {
        const channelIds = getServerChannelIds(serverIdToScope);
        queryClient.setQueriesData(
            { predicate: (q) => q.queryKey[0] === 'channelMembers' && channelIds.has(q.queryKey[1]) },
            (old) => old ? old.filter(m => m.user?.id !== userIdToRemove) : old,
        );
    }

    useEffect(() => {
        onUserServerUpdate((type, member) => {
            if(type === 'join') {
                queryClient.setQueryData(['members', member.serverId], (old) => {
                    if (!old) return old;
                    if (old.some(m => m.user?.id === member.user?.id)) return old;
                    return [...old, member];
                });
                // Channel visibility depends on role/overwrites we don't have
                // locally — let active channelMembers queries refetch.
                const channelIds = getServerChannelIds(member.serverId);
                queryClient.invalidateQueries({
                    predicate: (q) => q.queryKey[0] === 'channelMembers' && channelIds.has(q.queryKey[1]),
                });
            }

            if(type === 'kick') {
                if(member.userId === userIdRef.current) {
                    const servers = queryClient.getQueryData(['servers']);
                    const serverName = servers?.find(s => s.id === member.serverId)?.name ?? 'diesem Server';
                    evictFromServer(member.serverId);
                    setKicked({ serverId: member.serverId, serverName });
                } else {
                    queryClient.setQueryData(['members', member.serverId], (old) =>
                        old ? old.filter(m => m.user?.id !== member.userId) : old
                    );
                    removeFromChannelMemberCaches(member.serverId, member.userId);
                }
            }

            if(type === 'ban') {
                if(member.userId === userIdRef.current) {
                    const servers = queryClient.getQueryData(['servers']);
                    const serverName = servers?.find(s => s.id === member.serverId)?.name ?? 'diesem Server';
                    evictFromServer(member.serverId);
                    setBanned({ serverId: member.serverId, serverName, reason: member.reason ?? null });
                } else {
                    queryClient.setQueryData(['members', member.serverId], (old) =>
                        old ? old.filter(m => m.user?.id !== member.userId) : old
                    );
                    removeFromChannelMemberCaches(member.serverId, member.userId);
                }
            }

            if(type === 'updateRole') {
                queryClient.setQueryData(['members', member.serverId], (old) => {
                    if (!old) return old;
                    return old.map(m => m.id === member.id ? {...member, roles: member.roles} : m);
                });
                // Role changes can affect channel visibility — refetch so the
                // member appears/disappears from channel-scoped caches as their
                // VIEW_CHANNEL access changes.
                const channelIds = getServerChannelIds(member.serverId);
                queryClient.invalidateQueries({
                    predicate: (q) => q.queryKey[0] === 'channelMembers' && channelIds.has(q.queryKey[1]),
                });
            }
        });

        return () => onUserServerUpdate(null);
    }, [queryClient]);

    return { kicked, dismissKicked, banned, dismissBanned };
}