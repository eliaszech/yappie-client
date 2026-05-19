import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGamepad } from '@awesome.me/kit-95376d5d61/icons/classic/solid';
import { fetchMembers } from '../../services/api.js';

function ServerNowPlaying({ serverId }) {
    const { data: members = [] } = useQuery({
        queryKey: ['server-members', serverId],
        queryFn: () => fetchMembers('members', serverId),
        staleTime: 5 * 60 * 1000,
    });

    const { data: activities = {} } = useQuery({
        queryKey: ['activities'],
        queryFn: () => ({}),
        staleTime: Infinity,
    });

    const { data: presence = {} } = useQuery({
        queryKey: ['presence'],
        queryFn: () => ({}),
        staleTime: Infinity,
    });

    const counts = useMemo(() => {
        const map = new Map();
        for (const m of members) {
            const uid = m.user?.id;
            if (!uid) continue;
            const online = presence[uid]?.online ?? m.user.online;
            if (!online) continue;
            const a = activities[uid];
            if (!a?.name) continue;
            const existing = map.get(a.name);
            if (existing) existing.count += 1;
            else map.set(a.name, { name: a.name, icon: a.icon, count: 1 });
        }
        return Array.from(map.values()).sort((x, y) => y.count - x.count).slice(0, 4);
    }, [members, activities, presence]);

    if (counts.length === 0) return null;

    return (
        <div className="px-3 py-2.5 border-b border-border">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Spielen gerade
            </div>
            <div className="flex flex-wrap gap-1.5">
                {counts.map(c => (
                    <div
                        key={c.name}
                        title={`${c.count} ${c.count === 1 ? 'Mitglied spielt' : 'Mitglieder spielen'} ${c.name}`}
                        className="flex items-center gap-1.5 px-2 py-0.5 bg-primary/15 text-primary rounded-md text-xs border border-primary/25"
                    >
                        {c.icon ? (
                            <img src={c.icon} alt="" className="w-3.5 h-3.5 rounded-sm object-cover" />
                        ) : (
                            <FontAwesomeIcon icon={faGamepad} className="text-[10px]" />
                        )}
                        <span className="truncate max-w-[100px]">{c.name}</span>
                        <span className="font-semibold tabular-nums">{c.count}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default ServerNowPlaying;
