import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faXmark,
    faGamepad,
    faMessage,
    faUserPlus,
    faUserCheck,
    faPen,
    faTrash,
} from '@awesome.me/kit-95376d5d61/icons/classic/solid';
import { faUserClock } from '@awesome.me/kit-95376d5d61/icons/classic/light';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth.js';
import { useUserActivity, useActivityPlaytime } from '../../../hooks/useActivity.js';
import { useIsOnline, useUserStatus } from '../../../hooks/usePresence.js';
import { useProfileModal } from '../../../hooks/user/useProfileModal.js';
import { useSettings } from '../../../context/SettingsContext.jsx';
import {
    fetchUserProfile,
    fetchActivityStats,
    fetchMutualFriends,
    fetchCommonServers,
    fetchFriends,
    fetchOrCreateConversationWith,
    sendFriendRequest,
    acceptFriendRequest,
    deleteActivitySession,
    deleteAllActivitySessions,
} from '../../../services/api.js';
import { getSocket } from '../../../services/socket.js';
import { getActivityEnabled, subscribe as subscribeActivitySettings } from '../../../services/activitySettings.js';
import UserAvatar from '../UserAvatar.jsx';

function formatMs(ms) {
    if (!Number.isFinite(ms) || ms <= 0) return '0 Min';
    const totalMin = Math.floor(ms / 60_000);
    if (totalMin < 60) return `${totalMin} Min`;
    const hours = Math.floor(totalMin / 60);
    const minutes = totalMin % 60;
    if (hours < 24) return minutes ? `${hours} Std ${minutes} Min` : `${hours} Std`;
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    return remHours ? `${days} T ${remHours} Std` : `${days} T`;
}

function relativeDate(date) {
    const d = new Date(date);
    const diffMs = Date.now() - d.getTime();
    const min = Math.floor(diffMs / 60_000);
    if (min < 1) return 'gerade eben';
    if (min < 60) return `vor ${min} Min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `vor ${h} Std`;
    const days = Math.floor(h / 24);
    if (days < 7) return `vor ${days} ${days === 1 ? 'Tag' : 'Tagen'}`;
    return d.toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' });
}

function sessionDurationMs(s) {
    const end = s.endedAt ? new Date(s.endedAt).getTime() : Date.now();
    return Math.max(0, end - new Date(s.startedAt).getTime());
}

function ProfileModal({ userId }) {
    const { user: self, setUser } = useAuth();
    const { closeProfile } = useProfileModal();
    const { openSettings } = useSettings();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [tab, setTab] = useState('overview');
    const [range, setRange] = useState('30d');
    const [confirmingClear, setConfirmingClear] = useState(false);
    const [busy, setBusy] = useState(false);

    const isSelf = self.id === userId;

    const { data: fetchedProfile } = useQuery({
        queryKey: ['user-profile', userId],
        queryFn: () => fetchUserProfile(userId),
        staleTime: 5 * 60 * 1000,
        enabled: !isSelf,
    });
    const profile = isSelf
        ? self
        : (fetchedProfile && !fetchedProfile.error ? fetchedProfile : null);

    const { data: stats } = useQuery({
        queryKey: ['activity-stats', userId, range],
        queryFn: () => fetchActivityStats(userId, range),
        staleTime: 60 * 1000,
    });

    const { data: mutuals = [] } = useQuery({
        queryKey: ['mutual-friends', userId],
        queryFn: () => fetchMutualFriends(userId),
        staleTime: 5 * 60 * 1000,
        enabled: !isSelf,
    });

    const { data: commonServers = [] } = useQuery({
        queryKey: ['common-servers', userId],
        queryFn: () => fetchCommonServers(userId),
        staleTime: 5 * 60 * 1000,
        enabled: !isSelf,
    });


    const { data: friends = [] } = useQuery({
        queryKey: ['friends'],
        queryFn: fetchFriends,
        staleTime: 10 * 60 * 1000,
        enabled: !isSelf,
    });
    const friendship = friends.find(f => f.id === userId);

    const online = useIsOnline(userId) ?? profile?.online ?? false;
    const status = useUserStatus(userId) ?? profile?.status ?? 'online';
    const rawActivity = useUserActivity(userId);
    const [selfActivityEnabled, setSelfActivityEnabled] = useState(getActivityEnabled);
    useEffect(() => subscribeActivitySettings(() => setSelfActivityEnabled(getActivityEnabled())), []);
    // For our own profile, gate on the local sharing toggle so toggling off
    // hides the activity instantly, without waiting for the backend round-trip.
    const activity = (isSelf && !selfActivityEnabled) ? null : rawActivity;
    const showActivity = online && activity?.name;
    const playtimeLabel = useActivityPlaytime(activity?.since);

    useEffect(() => {
        function onKey(e) { if (e.key === 'Escape') closeProfile(); }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [closeProfile]);

    function invalidateActivityCaches() {
        queryClient.invalidateQueries({ queryKey: ['activity-stats', userId] });
        queryClient.invalidateQueries({ queryKey: ['my-activity-sessions'] });
        queryClient.invalidateQueries({ queryKey: ['friends-activity-feed'] });
    }

    async function handleDeleteSession(sessionId) {
        if (!isSelf) return;
        setBusy(true);
        const res = await deleteActivitySession(sessionId);
        if (!res.error) invalidateActivityCaches();
        setBusy(false);
    }

    async function handleClearAll() {
        if (!isSelf) return;
        setBusy(true);
        const res = await deleteAllActivitySessions();
        if (!res.error) invalidateActivityCaches();
        setConfirmingClear(false);
        setBusy(false);
    }

    async function handleSendDm() {
        const conversation = await fetchOrCreateConversationWith(userId);
        if (!conversation.error) {
            navigate(`/@me/messages/${conversation.id}`);
            closeProfile();
        }
    }

    async function handleFriendClick() {
        const socket = getSocket();
        if (!socket) return;
        if (!friendship) {
            const res = await sendFriendRequest(self.id, userId);
            if (!res.error) {
                queryClient.setQueryData(['friends'], old => old ? [...old, res] : [res]);
                socket.emit('friend:request', self.id, userId);
            }
        } else if (friendship.friendStatus === 'PENDING' && !friendship.isSender) {
            const res = await acceptFriendRequest(friendship.friendId, userId);
            if (!res.error) {
                queryClient.setQueryData(['friends'], old =>
                    old ? old.map(f => f.friendId === friendship.friendId ? { ...f, friendStatus: 'ACCEPTED' } : f) : old
                );
                socket.emit('friend:accept', friendship.friendId, userId);
            }
        }
    }

    let friendIcon = faUserPlus;
    let friendClass = 'bg-primary/15 text-primary border-primary/30 hover:bg-primary/25';
    let friendLabel = 'Freund hinzufügen';
    let friendClickable = true;
    if (friendship) {
        if (friendship.friendStatus === 'ACCEPTED') {
            friendIcon = faUserCheck;
            friendClass = 'bg-green-500/15 text-green-400 border-green-500/30 cursor-default';
            friendLabel = 'Befreundet';
            friendClickable = false;
        } else if (friendship.friendStatus === 'PENDING' && friendship.isSender) {
            friendIcon = faUserClock;
            friendClass = 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30 cursor-default';
            friendLabel = 'Anfrage gesendet';
            friendClickable = false;
        } else if (friendship.friendStatus === 'PENDING' && !friendship.isSender) {
            friendIcon = faUserCheck;
            friendClass = 'bg-blue-500/15 text-blue-400 border-blue-500/30 hover:bg-blue-500/25';
            friendLabel = 'Annehmen';
        }
    }

    const display = profile?.displayName ?? profile?.username ?? '';
    const banner = profile?.banner;
    const bio = profile?.bio;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={closeProfile}
        >
            <div
                className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close button */}
                <button
                    onClick={closeProfile}
                    className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md flex items-center justify-center text-white/90 cursor-pointer transition-colors"
                    title="Schließen"
                >
                    <FontAwesomeIcon icon={faXmark} />
                </button>

                {/* Banner */}
                <div
                    className="relative h-36 shrink-0"
                    style={banner ? undefined : {
                        background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)',
                    }}
                >
                    {banner ? (
                        <img src={banner} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                        <div
                            className="absolute inset-0 opacity-40 mix-blend-overlay pointer-events-none"
                            style={{ background: 'radial-gradient(circle at 30% 25%, rgba(255,255,255,0.55) 0%, transparent 55%)' }}
                        />
                    )}
                </div>

                {/* Header row: avatar + name + actions */}
                <div className="px-6 -mt-12 flex items-end gap-4 relative z-10">
                    <UserAvatar
                        size="w-28 h-28 text-4xl border-4 border-card shadow-xl"
                        onlineSize="w-6 h-6 bottom-1 right-1"
                        icon={(profile?.username ?? '?').charAt(0).toUpperCase()}
                        avatar={profile?.avatar}
                        online={online}
                        status={status}
                    />
                    <div className="flex-1 min-w-0 pb-2">
                        <div className="text-2xl leading-6 font-bold text-foreground truncate">{display}</div>
                        <div className="text-sm text-muted-foreground truncate">{profile?.username}</div>
                    </div>
                    {!isSelf && (
                        <div className="flex gap-2 pb-2">
                            <button
                                onClick={handleSendDm}
                                className="px-3 py-2 text-sm font-medium rounded-lg bg-muted/60 hover:bg-muted text-foreground border border-border cursor-pointer transition-colors flex items-center gap-2"
                            >
                                <FontAwesomeIcon icon={faMessage} />
                                Nachricht
                            </button>
                            <button
                                onClick={friendClickable ? handleFriendClick : undefined}
                                disabled={!friendClickable}
                                className={`px-3 py-2 text-sm font-medium rounded-lg border cursor-pointer transition-colors flex items-center gap-2 ${friendClass}`}
                            >
                                <FontAwesomeIcon icon={friendIcon} />
                                {friendLabel}
                            </button>
                        </div>
                    )}
                    {isSelf && (
                        <div className="pb-2">
                            <button
                                onClick={() => { closeProfile(); openSettings('profile'); }}
                                className="px-3 py-2 text-sm font-medium rounded-lg bg-muted/60 hover:bg-muted text-foreground border border-border cursor-pointer transition-colors flex items-center gap-2"
                            >
                                <FontAwesomeIcon icon={faPen} />
                                Profil bearbeiten
                            </button>
                        </div>
                    )}
                </div>

                {/* Tabs */}
                <div className="px-6 mt-4 border-b border-border flex gap-1 shrink-0">
                    {[
                        { id: 'overview', label: 'Übersicht' },
                        { id: 'activity', label: 'Aktivität' },
                        { id: 'mutual', label: 'Gemeinsam', hide: isSelf },
                    ].filter(t => !t.hide).map(t => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={`px-3 py-2 text-sm font-medium cursor-pointer transition-colors border-b-2 -mb-px ${
                                tab === t.id
                                    ? 'text-foreground border-primary'
                                    : 'text-muted-foreground border-transparent hover:text-foreground'
                            }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Tab body */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                    {tab === 'overview' && (
                        <>
                            {showActivity && (
                                <div
                                    className="p-3 rounded-xl border border-primary/25 relative overflow-hidden"
                                    style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.18) 0%, hsl(var(--accent) / 0.10) 100%)' }}
                                >
                                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                        Spielt gerade
                                    </span>
                                    <div className="mt-2 flex items-center gap-3">
                                        {activity.icon ? (
                                            <img src={activity.icon} alt="" className="w-12 h-12 rounded-lg object-cover" />
                                        ) : (
                                            <div className="w-12 h-12 rounded-lg bg-primary/25 text-primary flex items-center justify-center">
                                                <FontAwesomeIcon icon={faGamepad} />
                                            </div>
                                        )}
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-sm font-semibold text-foreground truncate">{activity.name}</span>
                                            {playtimeLabel && (
                                                <span className="text-[11px] text-primary truncate">{playtimeLabel}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {bio && (
                                <div className="p-3 rounded-xl bg-muted/40 border border-border">
                                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Über mich</span>
                                    <p className="text-sm text-foreground mt-1 whitespace-pre-wrap break-words">{bio}</p>
                                </div>
                            )}

                            {profile?.createdAt && (
                                <div className="p-3 rounded-xl bg-muted/40 border border-border">
                                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Mitglied seit</span>
                                    <p className="text-sm text-foreground mt-1">
                                        {new Date(profile.createdAt).toLocaleDateString('de-DE', {
                                            day: 'numeric', month: 'long', year: 'numeric',
                                        })}
                                    </p>
                                </div>
                            )}

                            {!isSelf && stats?.topGames?.length > 0 && (
                                <div className="p-3 rounded-xl bg-muted/40 border border-border">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Top Spiele (30 Tage)</span>
                                        <button onClick={() => setTab('activity')} className="text-xs text-primary hover:underline cursor-pointer">Alle anzeigen</button>
                                    </div>
                                    <div className="mt-2 space-y-1.5">
                                        {stats.topGames.slice(0, 3).map(g => (
                                            <div key={g.name} className="flex items-center gap-2.5">
                                                {g.icon ? (
                                                    <img src={g.icon} alt="" className="w-7 h-7 rounded object-cover" />
                                                ) : (
                                                    <div className="w-7 h-7 rounded bg-primary/20 text-primary flex items-center justify-center text-xs">
                                                        <FontAwesomeIcon icon={faGamepad} />
                                                    </div>
                                                )}
                                                <span className="text-sm text-foreground flex-1 truncate">{g.name}</span>
                                                <span className="text-xs text-muted-foreground">{formatMs(g.totalMs)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {tab === 'activity' && (
                        <>
                            <div className="flex gap-1 text-xs">
                                {[
                                    { id: '7d', label: '7 Tage' },
                                    { id: '30d', label: '30 Tage' },
                                    { id: '90d', label: '90 Tage' },
                                    { id: 'all', label: 'Gesamt' },
                                ].map(r => (
                                    <button
                                        key={r.id}
                                        onClick={() => setRange(r.id)}
                                        className={`px-2.5 py-1 rounded-md border cursor-pointer transition-colors ${
                                            range === r.id
                                                ? 'bg-primary/15 text-primary border-primary/30'
                                                : 'bg-muted/40 text-muted-foreground border-border hover:text-foreground'
                                        }`}
                                    >
                                        {r.label}
                                    </button>
                                ))}
                            </div>

                            <div>
                                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Top Spiele</h3>
                                {stats?.topGames?.length ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {stats.topGames.map(g => (
                                            <div key={g.name} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/40 border border-border">
                                                {g.icon ? (
                                                    <img src={g.icon} alt="" className="w-10 h-10 rounded-md object-cover shrink-0" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-md bg-primary/20 text-primary flex items-center justify-center shrink-0">
                                                        <FontAwesomeIcon icon={faGamepad} />
                                                    </div>
                                                )}
                                                <div className="min-w-0 flex-1">
                                                    <div className="text-sm font-medium text-foreground truncate">{g.name}</div>
                                                    <div className="text-xs text-muted-foreground">{formatMs(g.totalMs)} · {g.sessions} Sessions</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">Keine Aktivität in diesem Zeitraum.</p>
                                )}
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Verlauf</h3>
                                    {isSelf && stats?.recent?.length > 0 && !confirmingClear && (
                                        <button
                                            onClick={() => setConfirmingClear(true)}
                                            disabled={busy}
                                            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-dnd cursor-pointer transition-colors disabled:opacity-50"
                                        >
                                            <FontAwesomeIcon icon={faTrash} className="text-[10px]" />
                                            Verlauf löschen
                                        </button>
                                    )}
                                </div>
                                {isSelf && confirmingClear && (
                                    <div className="mb-2 p-2.5 rounded-lg bg-dnd/10 border border-dnd/30 flex items-center justify-between gap-3">
                                        <span className="text-xs text-foreground">
                                            Gesamten Verlauf löschen?
                                        </span>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                onClick={() => setConfirmingClear(false)}
                                                disabled={busy}
                                                className="px-2 py-1 rounded-md text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                                            >
                                                Abbrechen
                                            </button>
                                            <button
                                                onClick={handleClearAll}
                                                disabled={busy}
                                                className="px-2 py-1 rounded-md bg-dnd text-white text-xs font-medium hover:bg-dnd/90 cursor-pointer disabled:opacity-50"
                                            >
                                                Endgültig löschen
                                            </button>
                                        </div>
                                    </div>
                                )}
                                {stats?.recent?.length ? (
                                    <div className="space-y-1.5">
                                        {stats.recent.map(s => (
                                            <div key={s.id} className="group flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                                                {s.icon ? (
                                                    <img src={s.icon} alt="" className="w-8 h-8 rounded object-cover shrink-0" />
                                                ) : (
                                                    <div className="w-8 h-8 rounded bg-primary/20 text-primary flex items-center justify-center shrink-0 text-xs">
                                                        <FontAwesomeIcon icon={faGamepad} />
                                                    </div>
                                                )}
                                                <div className="min-w-0 flex-1">
                                                    <div className="text-sm text-foreground truncate">{s.name}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {relativeDate(s.startedAt)} · {formatMs(sessionDurationMs(s))}
                                                        {!s.endedAt && <span className="ml-1 text-primary">· läuft</span>}
                                                    </div>
                                                </div>
                                                {isSelf && (
                                                    <button
                                                        onClick={() => handleDeleteSession(s.id)}
                                                        disabled={busy}
                                                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-dnd cursor-pointer px-1.5 py-1 rounded-md hover:bg-muted/40 transition-all disabled:opacity-30"
                                                        title="Eintrag löschen"
                                                    >
                                                        <FontAwesomeIcon icon={faTrash} className="text-xs" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">Noch keine Sessions aufgezeichnet.</p>
                                )}
                            </div>
                        </>
                    )}

                    {tab === 'mutual' && !isSelf && (
                        <>
                            <div>
                                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                                    Gemeinsame Freunde ({mutuals.length})
                                </h3>
                                {mutuals.length ? (
                                    <div className="space-y-1">
                                        {mutuals.map(m => (
                                            <div key={m.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                                                <UserAvatar
                                                    size="w-9 h-9 text-sm"
                                                    onlineSize="w-2.5 h-2.5 bottom-0 right-0"
                                                    icon={m.username.charAt(0).toUpperCase()}
                                                    avatar={m.avatar}
                                                    online={m.online}
                                                    status={m.status}
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <div className="text-sm text-foreground truncate">{m.displayName ?? m.username}</div>
                                                    <div className="text-xs text-muted-foreground truncate">{m.username}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">Keine gemeinsamen Freunde.</p>
                                )}
                            </div>

                            <div>
                                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                                    Gemeinsame Server ({commonServers.length})
                                </h3>
                                {commonServers.length ? (
                                    <div className="space-y-1">
                                        {commonServers.map(s => (
                                            <div key={s.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                                                {s.icon ? (
                                                    <img src={s.icon} alt="" className="w-9 h-9 rounded-lg object-cover" />
                                                ) : (
                                                    <div className="w-9 h-9 rounded-lg bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">
                                                        {s.name.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <span className="text-sm text-foreground truncate">{s.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">Keine gemeinsamen Server.</p>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ProfileModal;
