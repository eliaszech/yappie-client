import { useEffect, useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faServer } from '@awesome.me/kit-95376d5d61/icons/classic/light';
import { faSpinner, faCircleExclamation } from '@awesome.me/kit-95376d5d61/icons/classic/solid';
import { resolveInvite, joinServer } from '../../services/api.js';
import { getSocket } from '../../services/socket.js';
import { useAuth } from '../../hooks/useAuth.js';
import UserAvatar from '../components/UserAvatar.jsx';

function InviteJoin() {
    const { code } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const [joining, setJoining] = useState(false);
    const [joinError, setJoinError] = useState('');

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['invite-resolve', code],
        queryFn: () => resolveInvite(code),
        retry: false,
        staleTime: 30 * 1000,
    });

    useEffect(() => {
        if (data?.alreadyMember && data?.server?.id) {
            navigate(`/servers/${data.server.id}`, { replace: true });
        }
    }, [data, navigate]);

    if (!code) return <Navigate to="/@me/friends" replace />;

    async function handleJoin() {
        setJoining(true);
        setJoinError('');
        const res = await joinServer(code);
        if (res?.error) {
            setJoinError(res.error);
            setJoining(false);
            return;
        }
        const server = res.server ?? res.member?.server;
        if (!res.alreadyMember && server) {
            queryClient.setQueryData(['servers'], (old) => {
                if (!Array.isArray(old)) return old;
                if (old.some(s => s.id === server.id)) return old;
                return [...old, server];
            });
            const socket = getSocket();
            if (socket && user) socket.emit('server:user:update', 'join', user.id, server.id);
        }
        if (server?.id) navigate(`/servers/${server.id}`, { replace: true });
        else setJoining(false);
    }

    const invalid = isError || data?.error;
    const inviteData = !invalid ? data : null;
    const exhausted = inviteData?.exhausted;
    const expired = inviteData?.expired;
    const blocked = exhausted || expired;

    return (
        <div className="flex-1 flex items-center justify-center px-4 py-10">
            <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                <div
                    className="h-24 relative"
                    style={{ background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)' }}
                >
                    <div
                        className="absolute inset-0 opacity-40 mix-blend-overlay pointer-events-none"
                        style={{ background: 'radial-gradient(circle at 30% 25%, rgba(255,255,255,0.55) 0%, transparent 55%)' }}
                    />
                </div>

                <div className="px-6 -mt-10 pb-6">
                    {isLoading && (
                        <div className="flex flex-col items-center text-center pt-6">
                            <FontAwesomeIcon icon={faSpinner} spin className="text-2xl text-muted-foreground" />
                            <p className="mt-3 text-sm text-muted-foreground">Einladung wird geladen…</p>
                        </div>
                    )}

                    {invalid && (
                        <div className="flex flex-col items-center text-center pt-6">
                            <FontAwesomeIcon icon={faCircleExclamation} className="text-3xl text-dnd" />
                            <h2 className="mt-3 text-lg font-bold text-foreground">Einladung ungültig</h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {error?.message || data?.error || 'Diese Einladung existiert nicht oder wurde entfernt.'}
                            </p>
                            <button
                                onClick={() => navigate('/@me/friends')}
                                className="mt-4 px-4 py-2 rounded-md bg-muted text-foreground hover:bg-muted/70 cursor-pointer text-sm"
                            >
                                Zurück
                            </button>
                        </div>
                    )}

                    {inviteData && (
                        <>
                            <div className="flex items-center gap-4">
                                {inviteData.server.icon ? (
                                    <img src={inviteData.server.icon} alt="" className="w-20 h-20 rounded-2xl border-4 border-card shadow-xl object-cover" />
                                ) : (
                                    <div className="w-20 h-20 rounded-2xl border-4 border-card shadow-xl bg-primary/20 text-primary flex items-center justify-center text-3xl font-bold">
                                        <FontAwesomeIcon icon={faServer} />
                                    </div>
                                )}
                                <div className="min-w-0 flex-1 pt-3">
                                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                                        Du wurdest eingeladen zu
                                    </div>
                                    <div className="text-xl font-bold text-foreground truncate">{inviteData.server.name}</div>
                                    <div className="text-xs text-muted-foreground">
                                        {inviteData.server._count?.members ?? 0} Mitglieder
                                    </div>
                                </div>
                            </div>

                            {inviteData.creator && (
                                <div className="mt-4 flex items-center gap-2.5 p-2.5 rounded-lg bg-muted/40 border border-border">
                                    <UserAvatar
                                        size="w-8 h-8 text-sm"
                                        displayOnline={false}
                                        icon={inviteData.creator.username.charAt(0).toUpperCase()}
                                        avatar={inviteData.creator.avatar}
                                    />
                                    <div className="min-w-0 flex-1">
                                        <span className="text-xs text-muted-foreground">Eingeladen von</span>
                                        <div className="text-sm text-foreground truncate">
                                            {inviteData.creator.displayName ?? inviteData.creator.username}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {blocked && (
                                <div className="mt-4 p-3 rounded-lg bg-dnd/10 border border-dnd/30 text-sm text-dnd">
                                    {expired ? 'Diese Einladung ist abgelaufen.' : 'Diese Einladung hat ihr Maximum erreicht.'}
                                </div>
                            )}

                            {joinError && (
                                <p className="mt-3 text-sm text-dnd">{joinError}</p>
                            )}

                            <button
                                onClick={handleJoin}
                                disabled={joining || blocked}
                                className="mt-5 w-full py-2.5 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {joining && <FontAwesomeIcon icon={faSpinner} spin />}
                                Server beitreten
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default InviteJoin;
