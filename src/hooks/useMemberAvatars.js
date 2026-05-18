import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchMembers } from '../services/api';

export function useMemberAvatars(serverId) {
    const { data: members = [] } = useQuery({
        queryKey: ['members', serverId],
        queryFn: () => fetchMembers('members', serverId),
        staleTime: 10 * 60 * 1000,
        enabled: !!serverId,
    });

    return useMemo(() => {
        const map = new Map();
        for (const m of members) {
            if (m?.user?.id) map.set(m.user.id, m.user.avatar);
        }
        return map;
    }, [members]);
}