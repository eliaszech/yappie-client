import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faServer } from '@awesome.me/kit-95376d5d61/icons/classic/light';
import { faSpinner, faCircleExclamation } from '@awesome.me/kit-95376d5d61/icons/classic/solid';
import { resolveInvite, joinServer } from '../../../services/api.js';
import { useAuth } from '../../../hooks/useAuth.js';
import { getSocket } from '../../../services/socket.js';
import UserAvatar from '../../components/UserAvatar.jsx';

function relativeUntil(date) {
    const diffMs = new Date(date).getTime() - Date.now();
    if (diffMs <= 0) return 'abgelaufen';
    const min = Math.floor(diffMs / 60_000);
    if (min < 60) return `in ${min} Min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `in ${h} Std`;
    const days = Math.floor(h / 24);
    return `in ${days}${days === 1 ? ' Tag' : ' Tagen'}`;
}

function InviteCard({ code }) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const [joining, setJoining] = useState(false);

    const { data, isLoading, isError } = useQuery({
        queryKey: ['invite-resolve', code],
        queryFn: () => resolveInvite(code),
        enabled: !!code,
        retry: false,
        staleTime: 30 * 1000,
    });

    if (!code) return null;

    if (isLoading) {
        return (
            <div className="rounded-lg bg-card border border-border w-[280px] px-4 py-3 flex items-center gap-2 text-sm text-muted-foreground">
                <FontAwesomeIcon icon={faSpinner} spin />
                <span>Einladung wird geladen…</span>
            </div>
        );
    }

    const invalid = isError || data?.error || !data?.server;
    if (invalid) {
        return (
            <div className="rounded-lg bg-card border border-border w-[280px] px-4 py-3 flex items-center gap-2.5">
                <FontAwesomeIcon icon={faCircleExclamation} className="text-dnd text-lg" />
                <div className="flex flex-col min-w-0">
                    <span className="text-sm font-semibold text-foreground">Einladung ungültig</span>
                    <span className="text-xs text-muted-foreground truncate">
                        {data?.error || 'Diese Einladung existiert nicht mehr.'}
                    </span>
                </div>
            </div>
        );
    }

    const expired = data.expired;
    const exhausted = data.exhausted;
    const alreadyMember = data.alreadyMember;
    const blocked = expired || exhausted;

    async function handleJoin() {
        if (blocked) return;
        if (alreadyMember && data.server?.id) {
            navigate(`/servers/${data.server.id}`);
            return;
        }
        setJoining(true);
        const res = await joinServer(code);
        setJoining(false);
        if (res?.error) {
            alert(res.error);
            return;
        }
        const server = res?.server ?? res?.member?.server;
        if (!res?.alreadyMember && server) {
            queryClient.setQueryData(['servers'], (old) => {
                if (!Array.isArray(old)) return old;
                if (old.some(s => s.id === server.id)) return old;
                return [...old, server];
            });
            const socket = getSocket();
            if (socket && user) socket.emit('server:user:update', 'join', user.id, server.id);
        }
        if (server?.id) navigate(`/servers/${server.id}`);
    }

    const buttonLabel = alreadyMember ? 'Bereits beigetreten'
        : expired ? 'Abgelaufen'
        : exhausted ? 'Limit erreicht'
        : 'Beitreten';

    return (
        <div className="rounded-lg bg-card border border-border w-[280px] overflow-hidden">
            <div
                className="h-12 relative"
                style={{ background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)' }}
            />

            <div className="px-4 relative -mt-8">
                {data.server.icon ? (
                    <img src={data.server.icon} alt="" className="w-14 h-14 rounded-2xl border-4 border-card object-cover" />
                ) : (
                    <div className="w-14 h-14 rounded-2xl border-4 border-card bg-primary/20 text-primary flex items-center justify-center text-xl">
                        <FontAwesomeIcon icon={faServer} />
                    </div>
                )}
            </div>

            <div className="px-4 flex flex-col pt-2 pb-4">
                <div className="font-bold text-base text-foreground truncate" title={data.server.name}>
                    {data.server.name}
                </div>
                <div className="text-xs text-muted-foreground mb-2">
                    {data.server._count?.members ?? 0} Mitglieder
                </div>

                {data.creator && (
                    <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                        <UserAvatar
                            size="w-5 h-5 text-[10px]"
                            displayOnline={false}
                            icon={data.creator.username.charAt(0).toUpperCase()}
                            avatar={data.creator.avatar}
                        />
                        <span className="truncate">
                            von <span className="text-foreground">{data.creator.displayName ?? data.creator.username}</span>
                        </span>
                    </div>
                )}

                {!blocked && (data.maxUses != null || data.expiresAt) && (
                    <div className="flex flex-wrap gap-1.5 mb-3 text-[10px]">
                        {data.maxUses != null && (
                            <span className="px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground border border-border">
                                <span className="text-foreground font-medium">{data.uses ?? 0}</span>
                                /{data.maxUses} Verwendungen
                            </span>
                        )}
                        {data.expiresAt && (
                            <span className="px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground border border-border">
                                Läuft {relativeUntil(data.expiresAt)} ab
                            </span>
                        )}
                    </div>
                )}

                {blocked && (
                    <div className="mb-2 px-2 py-1 rounded bg-dnd/10 border border-dnd/30 text-[11px] text-dnd">
                        {expired ? 'Diese Einladung ist abgelaufen.' : 'Diese Einladung hat ihr Maximum erreicht.'}
                    </div>
                )}

                <button
                    onClick={handleJoin}
                    disabled={blocked || joining}
                    className={`cursor-pointer text-sm px-2 py-1.5 rounded-md font-medium flex items-center justify-center gap-1.5 transition-colors ${
                        blocked
                            ? 'bg-muted/40 text-muted-foreground cursor-not-allowed'
                            : alreadyMember
                                ? 'bg-muted/60 text-foreground hover:bg-muted'
                                : 'bg-primary text-primary-foreground hover:bg-primary/90'
                    }`}
                >
                    {joining && <FontAwesomeIcon icon={faSpinner} spin className="text-xs" />}
                    {buttonLabel}
                </button>
            </div>
        </div>
    );
}

export default InviteCard;
