import { useQuery } from '@tanstack/react-query';
import { fetchMembers, fetchRoles } from '../services/api.js';

// Returns the color of the highest hoistable role that the given user holds
// on the given server, or null. Used by the message renderer to tint the
// username with the user's "visible group" color.
export function useMemberTopRoleColor(serverId, userId) {
    const { data: members = [] } = useQuery({
        queryKey: ['members', serverId],
        queryFn: () => fetchMembers('members', serverId),
        enabled: !!serverId,
        staleTime: 5 * 60 * 1000,
    });

    const { data: roles = [] } = useQuery({
        queryKey: ['roles', serverId],
        queryFn: () => fetchRoles(serverId),
        enabled: !!serverId,
        staleTime: 5 * 60 * 1000,
    });

    if (!serverId || !userId) return null;
    const member = members.find(m => m.user?.id === userId);
    if (!member) return null;
    const memberRoleIds = new Set((member.roles || []).map(r => r.role?.id ?? r.id));

    // roles is ordered [isOwnerRole desc, position desc] → index 0 = top of
    // hierarchy. Walk down and return the first hoisted+colored role.
    for (const role of roles) {
        if (role.isEveryone) continue;
        if (!role.hoist) continue;
        if (!role.color) continue;
        if (memberRoleIds.has(role.id)) return role.color;
    }
    return null;
}
