import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { onRoleChange, onMemberRolesChange } from '../services/socket.js';
import { useAuth } from './useAuth.js';

// Keeps the local roles/members cache in sync with backend role mutations.
// Crucially, also invalidates ['server', serverId] so a user whose effective
// permissions changed sees the new abilities immediately, without reload.
export function useRoleSubscription() {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    useEffect(() => {
        onRoleChange((kind, data) => {
            const serverId = data?.serverId;
            if (!serverId) return;

            if (kind === 'created') {
                queryClient.setQueryData(['roles', serverId], (old) =>
                    Array.isArray(old) ? [...old, data.role] : old
                );
            } else if (kind === 'updated') {
                queryClient.setQueryData(['roles', serverId], (old) =>
                    Array.isArray(old) ? old.map(r => r.id === data.role.id ? data.role : r) : old
                );
                // Permission bits may have changed for a role I hold — refetch server
                // context so canDo() updates and member badges recolor.
                queryClient.invalidateQueries({ queryKey: ['server', serverId] });
                queryClient.invalidateQueries({ queryKey: ['members', serverId] });
            } else if (kind === 'deleted') {
                queryClient.setQueryData(['roles', serverId], (old) =>
                    Array.isArray(old) ? old.filter(r => r.id !== data.roleId) : old
                );
                queryClient.invalidateQueries({ queryKey: ['server', serverId] });
                queryClient.invalidateQueries({ queryKey: ['members', serverId] });
            } else if (kind === 'positions') {
                if (Array.isArray(data.roles)) {
                    queryClient.setQueryData(['roles', serverId], data.roles);
                }
                queryClient.invalidateQueries({ queryKey: ['members', serverId] });
            }
        });

        onMemberRolesChange(({ serverId, userId }) => {
            if (!serverId) return;
            queryClient.invalidateQueries({ queryKey: ['members', serverId] });
            // Only refresh my own server context when the change touches me —
            // others' role swaps don't alter my permissions.
            if (user && userId === user.id) {
                queryClient.invalidateQueries({ queryKey: ['server', serverId] });
            }
        });

        return () => {
            onRoleChange(null);
            onMemberRolesChange(null);
        };
    }, [queryClient, user]);
}
