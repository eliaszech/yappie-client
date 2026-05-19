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
        queryClient.setQueryData(['servers'], (old) =>
            old ? old.filter(s => s.id !== serverIdToEvict) : old
        );
        queryClient.removeQueries({ queryKey: ['server', serverIdToEvict] });
        queryClient.removeQueries({ queryKey: ['channels', serverIdToEvict] });
        queryClient.removeQueries({ queryKey: ['members', serverIdToEvict] });
    }

    useEffect(() => {
        onUserServerUpdate((type, member) => {
            if(type === 'join') {
                queryClient.setQueryData(['members', member.serverId], (old) => {
                    if (!old) return old;
                    if (old.some(m => m.user?.id === member.user?.id)) return old;
                    return [...old, member];
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
                }
            }

            if(type === 'updateRole') {
                queryClient.setQueryData(['members', member.serverId], (old) => {
                    if (!old) return old;
                    return old.map(m => m.id === member.id ? {...member, roles: member.roles} : m);
                });
            }
        });

        return () => onUserServerUpdate(null);
    }, [queryClient]);

    return { kicked, dismissKicked, banned, dismissBanned };
}