import { useQuery } from '@tanstack/react-query';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGamepad } from '@awesome.me/kit-95376d5d61/icons/classic/solid';
import { faMoon } from '@awesome.me/kit-95376d5d61/icons/classic/light';
import { fetchFriends, fetchFriendsActivityFeed } from '../../../services/api.js';
import { useProfileModal } from '../../../hooks/user/useProfileModal.js';
import UserAvatar from '../../components/UserAvatar.jsx';

function formatDurationMs(ms) {
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

function relativeFromNow(date) {
    const d = new Date(date);
    const diffMs = Date.now() - d.getTime();
    const min = Math.floor(diffMs / 60_000);
    if (min < 1) return 'gerade eben';
    if (min < 60) return `vor ${min} Min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `vor ${h} Std`;
    const days = Math.floor(h / 24);
    if (days < 7) return `vor ${days}${days === 1 ? ' Tag' : ' Tagen'}`;
    return d.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
}

function GameIcon({ icon, size = 'sm' }) {
    const dim = size === 'lg' ? 'w-10 h-10' : 'w-9 h-9';
    if (icon) return <img src={icon} alt="" className={`${dim} rounded-md object-cover shrink-0`} />;
    return (
        <div className={`${dim} rounded-md bg-primary/20 text-primary flex items-center justify-center shrink-0`}>
            <FontAwesomeIcon icon={faGamepad} />
        </div>
    );
}

function FriendsActivityPanel() {
    const { openProfile } = useProfileModal();

    const { data: friends = [] } = useQuery({
        queryKey: ['friends'],
        queryFn: fetchFriends,
        staleTime: 10 * 60 * 1000,
    });
    const acceptedFriends = friends.filter(f => f.friendStatus === 'ACCEPTED');

    const { data: activities = {} } = useQuery({
        queryKey: ['activities'],
        queryFn: () => ({}),
        staleTime: Infinity,
    });

    const { data: feed = [] } = useQuery({
        queryKey: ['friends-activity-feed'],
        queryFn: () => fetchFriendsActivityFeed(40),
        staleTime: 30 * 1000,
    });
    const feedList = Array.isArray(feed) ? feed : [];

    // "Spielen gerade" = accepted friends with an active activity entry.
    const playingNow = acceptedFriends
        .map(f => ({ friend: f, activity: activities[f.id] }))
        .filter(x => x.activity && x.friend.online);

    // "Verlauf" = recent finished sessions from feed, excluding ones still open
    // (those already show up in "Spielen gerade").
    const recent = feedList.filter(s => s.endedAt);

    if (acceptedFriends.length === 0) return null;

    return (
        <aside className="hidden xl:flex flex-col w-80 border-l border-border bg-card/30 overflow-hidden">
            <div className="px-4 py-4 border-b border-border shrink-0">
                <h2 className="text-lg font-bold tracking-wider text-foreground">Freunde-Aktivität</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Was deine Freunde gerade machen.</p>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar">
                <section className="px-3 py-3">
                    <h3 className="px-1 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Spielen gerade {playingNow.length > 0 && `· ${playingNow.length}`}
                    </h3>
                    {playingNow.length ? (
                        <div className="space-y-1">
                            {playingNow.map(({ friend, activity }) => (
                                <button
                                    key={friend.id}
                                    onClick={() => openProfile(friend.id)}
                                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted/40 cursor-pointer transition-colors text-left"
                                >
                                    <UserAvatar
                                        size="w-9 h-9 text-sm"
                                        onlineSize="w-2.5 h-2.5 bottom-0 right-0"
                                        icon={friend.username.charAt(0).toUpperCase()}
                                        avatar={friend.avatar}
                                        online={friend.online}
                                        status={friend.status}
                                    />
                                    <div className="min-w-0 flex-1">
                                        <div className="text-sm font-medium text-foreground truncate">
                                            {friend.displayName ?? friend.username}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-primary truncate">
                                            <FontAwesomeIcon icon={faGamepad} className="text-[10px]" />
                                            <span className="truncate">{activity.name}</span>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="px-2 py-3 text-xs text-muted-foreground flex items-center gap-2">
                            <FontAwesomeIcon icon={faMoon} className="opacity-60" />
                            <span>Niemand spielt gerade.</span>
                        </div>
                    )}
                </section>

                <section className="px-3 py-3 border-t border-border">
                    <h3 className="px-1 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Kürzlich
                    </h3>
                    {recent.length ? (
                        <div className="space-y-1">
                            {recent.map(s => {
                                const durationMs = (new Date(s.endedAt).getTime()) - (new Date(s.startedAt).getTime());
                                const u = s.user;
                                return (
                                    <button
                                        key={s.id}
                                        onClick={() => openProfile(u.id)}
                                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted/40 cursor-pointer transition-colors text-left"
                                    >
                                        <GameIcon icon={s.icon} />
                                        <div className="min-w-0 flex-1">
                                            <div className="text-sm text-foreground truncate">
                                                <span className="font-medium">{u.displayName ?? u.username}</span>
                                                <span className="text-muted-foreground"> spielte </span>
                                                <span>{s.name}</span>
                                            </div>
                                            <div className="text-[11px] text-muted-foreground">
                                                {formatDurationMs(durationMs)} · {relativeFromNow(s.endedAt)}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="px-2 py-3 text-xs text-muted-foreground">Noch keine Aktivität.</p>
                    )}
                </section>
            </div>
        </aside>
    );
}

export default FriendsActivityPanel;
